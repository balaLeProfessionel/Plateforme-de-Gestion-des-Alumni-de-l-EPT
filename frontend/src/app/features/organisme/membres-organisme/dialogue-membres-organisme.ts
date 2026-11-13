import { Component, DestroyRef, computed, ElementRef, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MembreOrganisme, PresenceMembre } from '../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { periodeMembre } from './periode-membre';

const TAILLE_LOT = 20;
const DELAI_SAISIE_MS = 300;

/**
 * Tous les membres passés par l'organisme, dans une fenêtre modale native (focus piégé, Échap et
 * retour du focus gérés par le navigateur) : recherche par nom, filtre de présence, « Afficher plus ».
 */
@Component({
  selector: 'app-dialogue-membres-organisme',
  imports: [AvatarMembre, FormField, RouterLink],
  templateUrl: './dialogue-membres-organisme.html',
  styleUrl: './dialogue-membres-organisme.scss',
})
export class DialogueMembresOrganisme {
  readonly organismeId = input.required<string>();
  readonly nomOrganisme = input('');
  readonly ouverte = input(false);
  readonly presenceInitiale = input<PresenceMembre | null>(null);
  readonly fermee = output<void>();

  private readonly organismeService = inject(OrganismeService);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.recherche, 100);
  });
  protected readonly rechercheAppliquee = signal('');
  protected readonly presence = signal<PresenceMembre | null>(null);
  protected readonly membres = signal<readonly MembreOrganisme[]>([]);
  protected readonly total = signal(0);
  protected readonly actuels = signal(0);
  protected readonly anciens = signal(0);
  protected readonly page = signal(0);
  protected readonly chargement = signal(false);
  protected readonly premierChargement = signal(true);
  protected readonly erreur = signal('');
  protected readonly annonce = signal('');
  private numeroRequete = 0;
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  protected readonly restants = computed(() => this.total() - this.membres().length);
  protected readonly filtres = computed(() => [
    { valeur: null, libelle: 'Tous', nombre: this.actuels() + this.anciens() },
    { valeur: 'ACTUELS' as const, libelle: 'Actuellement', nombre: this.actuels() },
    { valeur: 'ANCIENS' as const, libelle: 'Anciens', nombre: this.anciens() },
  ]);
  protected readonly periode = periodeMembre;

  constructor() {
    effect(() => {
      const ouverte = this.ouverte();
      const dialogue = this.dialogue().nativeElement;
      if (ouverte) {
        // jsdom n’implémente pas showModal : la fenêtre reste alors fermée dans les tests.
        if (!dialogue.open && typeof dialogue.showModal === 'function') dialogue.showModal();
        untracked(() => {
          this.modele.set({ recherche: '' });
          this.rechercheAppliquee.set('');
          this.presence.set(this.presenceInitiale());
          this.premierChargement.set(true);
          void this.charger(0);
        });
      } else if (dialogue.open) {
        dialogue.close();
      }
    });

    // La saisie s’applique après une courte pause ; Entrée l’applique tout de suite.
    effect(() => {
      const saisie = this.modele().recherche.trim();
      clearTimeout(this.minuterie);
      if (saisie === untracked(this.rechercheAppliquee)) return;
      this.minuterie = setTimeout(() => this.lancerRecherche(saisie), DELAI_SAISIE_MS);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
  }

  protected fermer(): void {
    this.dialogue().nativeElement.close();
  }

  protected choisirPresence(presence: PresenceMembre | null): void {
    if (presence === this.presence()) return;
    this.presence.set(presence);
    void this.charger(0);
  }

  protected appliquerRecherche(evenement: Event): void {
    evenement.preventDefault();
    clearTimeout(this.minuterie);
    this.lancerRecherche(this.modele().recherche.trim());
  }

  private lancerRecherche(saisie: string): void {
    if (saisie === this.rechercheAppliquee()) return;
    this.rechercheAppliquee.set(saisie);
    void this.charger(0);
  }

  /** Page 0 : remplace la liste ; pages suivantes : la complète. */
  protected async charger(page: number): Promise<void> {
    const numero = ++this.numeroRequete;
    const recherche = this.rechercheAppliquee();
    this.chargement.set(true);
    this.erreur.set('');
    try {
      const resultat = await firstValueFrom(this.organismeService.listerMembres(
        this.organismeId(), page, TAILLE_LOT, this.presence(), recherche));
      if (numero !== this.numeroRequete) return; // une demande plus récente a pris le relais
      this.membres.update((actuels) => (page === 0 ? resultat.contenu : [...actuels, ...resultat.contenu]));
      this.total.set(resultat.totalElements);
      this.actuels.set(resultat.actuels);
      this.anciens.set(resultat.anciens);
      this.page.set(resultat.page);
      const nombre = resultat.totalElements;
      this.annonce.set(recherche
        ? `${nombre} ${nombre === 1 ? 'membre trouvé' : 'membres trouvés'}`
        : `${this.membres().length} membres affichés sur ${nombre}`);
    } catch {
      if (numero !== this.numeroRequete) return;
      this.erreur.set('La liste des membres n’a pas pu être chargée.');
    } finally {
      if (numero === this.numeroRequete) {
        this.chargement.set(false);
        this.premierChargement.set(false);
      }
    }
  }
}
