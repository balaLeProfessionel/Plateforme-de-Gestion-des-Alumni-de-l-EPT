import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MembreOrganisme, PresenceMembre, ResumeReseauOrganisme } from '../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { DialogueMembresOrganisme } from './dialogue-membres-organisme';
import { periodeMembre } from './periode-membre';

/** Vignettes affichées par onglet ; le reste est dans la fenêtre « Voir les … membres ». */
const TAILLE_APERCU = 8;

/**
 * « Ils travaillent ou ont travaillé ici » : vignettes des membres visibles dans l'annuaire dont le
 * parcours passe par l'organisme, en deux onglets (encore en poste, anciens), et la liste complète
 * avec recherche dans une fenêtre.
 */
@Component({
  selector: 'app-membres-organisme',
  imports: [RouterLink, AvatarMembre, DialogueMembresOrganisme],
  templateUrl: './membres-organisme.html',
  styleUrl: './membres-organisme.scss',
})
export class MembresOrganisme {
  private readonly organismeService = inject(OrganismeService);
  private requete = 0;
  private resumeEmis = false;

  readonly organismeId = input.required<string>();
  readonly nomOrganisme = input('');
  /** Émis au premier chargement : l'en-tête de la fiche en tire sa ligne « réseau EPT ». */
  readonly resumeCharge = output<ResumeReseauOrganisme>();

  protected readonly onglet = signal<PresenceMembre>('ACTUELS');
  protected readonly apercu = signal<readonly MembreOrganisme[]>([]);
  protected readonly actuels = signal(0);
  protected readonly anciens = signal(0);
  protected readonly chargement = signal(true);
  protected readonly charge = signal(false);
  protected readonly erreur = signal('');
  protected readonly dialogueOuverte = signal(false);

  protected readonly total = computed(() => this.actuels() + this.anciens());
  /** Un onglet vide n'est pas proposé ; avec un seul groupe, les onglets disparaissent. */
  protected readonly onglets = computed(() => [
    { valeur: 'ACTUELS' as const, libelle: 'Actuellement', nombre: this.actuels() },
    { valeur: 'ANCIENS' as const, libelle: 'Anciens', nombre: this.anciens() },
  ].filter((onglet) => onglet.nombre > 0));
  protected readonly libelleTout = computed(() =>
    this.total() > 1 ? `Voir les ${this.total()} membres` : 'Voir le membre');
  protected readonly periode = periodeMembre;

  constructor() {
    effect(() => {
      this.organismeId();
      untracked(() => {
        this.charge.set(false);
        this.resumeEmis = false;
        this.onglet.set('ACTUELS');
        this.charger();
      });
    });
  }

  protected choisirOnglet(onglet: PresenceMembre): void {
    if (onglet === this.onglet()) return;
    this.onglet.set(onglet);
    this.charger();
  }

  protected charger(): void {
    const requete = ++this.requete;
    this.chargement.set(true);
    this.erreur.set('');
    this.organismeService.listerMembres(this.organismeId(), 0, TAILLE_APERCU, this.onglet()).subscribe({
      next: (resultat) => {
        if (requete !== this.requete) return;
        this.actuels.set(resultat.actuels);
        this.anciens.set(resultat.anciens);
        // Personne n'y travaille plus : on ouvre directement sur les anciens.
        if (!this.charge() && resultat.actuels === 0 && resultat.anciens > 0 && this.onglet() === 'ACTUELS') {
          this.charge.set(true);
          this.onglet.set('ANCIENS');
          this.charger();
          return;
        }
        this.apercu.set(resultat.contenu);
        this.chargement.set(false);
        if (!this.resumeEmis) {
          this.resumeEmis = true;
          this.resumeCharge.emit({ actuels: resultat.actuels, anciens: resultat.anciens, apercu: resultat.contenu });
        }
        this.charge.set(true);
      },
      error: () => {
        if (requete !== this.requete) return;
        this.erreur.set('La liste des membres n’a pas pu être chargée.');
        this.chargement.set(false);
      },
    });
  }
}
