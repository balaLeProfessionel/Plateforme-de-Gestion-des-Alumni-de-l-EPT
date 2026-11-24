import { afterNextRender, Component, computed, ElementRef, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { AdminCommunautesService } from '../../../core/services/admin/admin-communautes';
import {
  AccesCommunaute, CATEGORIES_A_CREER, CategorieCommunaute, CommunauteAdmin, LIBELLES_CATEGORIE,
  LONGUEUR_MAX_DESCRIPTION_GROUPE, LONGUEUR_MAX_NOM_GROUPE, ModificationCommunaute, NATURES_COMMUNAUTE,
} from '../../../core/services/models/messagerie.model';
import { messageServeur } from '../../messagerie/message-erreur';

interface Valeurs {
  nom: string;
  description: string;
  categorie: CategorieCommunaute;
  acces: AccesCommunaute;
}

function valeursDe(communaute: CommunauteAdmin | null): Valeurs {
  return communaute
    ? { nom: communaute.nom, description: communaute.description ?? '', categorie: communaute.categorie, acces: communaute.acces }
    : { nom: '', description: '', categorie: 'VILLE', acces: 'OUVERTE' };
}

/**
 * Fenêtre de création (sans `communaute`) ou de modification d’une communauté. Une communauté de promo ou de
 * filière ne change que de description : son nom et son accès suivent les profils. Le parent la retire
 * à `fermee` et rend le focus au bouton qui l’a ouverte.
 */
@Component({
  selector: 'app-fenetre-communaute',
  imports: [FormField],
  templateUrl: './fenetre-communaute.html',
  styleUrl: './fenetre-communaute.scss',
})
export class FenetreCommunaute {
  private readonly service = inject(AdminCommunautesService);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  /** La communauté à modifier ; `null` pour en créer une. */
  readonly communaute = input<CommunauteAdmin | null>(null);
  readonly enregistree = output<CommunauteAdmin>();
  readonly fermee = output<void>();

  protected readonly categories = CATEGORIES_A_CREER;
  protected readonly libelles = LIBELLES_CATEGORIE;
  protected readonly longueurNom = LONGUEUR_MAX_NOM_GROUPE;
  protected readonly longueurDescription = LONGUEUR_MAX_DESCRIPTION_GROUPE;
  protected readonly creation = computed(() => this.communaute() === null);
  protected readonly automatique = computed(() => this.communaute()?.automatique ?? false);
  protected readonly nature = computed(() => {
    const communaute = this.communaute();
    return communaute ? NATURES_COMMUNAUTE[communaute.categorie] : '';
  });

  protected readonly modele = linkedSignal(() => valeursDe(this.communaute()));
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Donnez un nom à la communauté.' });
    validate(champ.nom, ({ value }) => value().trim() === '' && value() !== ''
      ? { kind: 'vide', message: 'Donnez un nom à la communauté.' } : undefined);
    maxLength(champ.nom, LONGUEUR_MAX_NOM_GROUPE, { message: `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_GROUPE} caractères.` });
    maxLength(champ.description, LONGUEUR_MAX_DESCRIPTION_GROUPE,
      { message: `La description ne peut pas dépasser ${LONGUEUR_MAX_DESCRIPTION_GROUPE} caractères.` });
  });
  /** En modification, rien à enregistrer tant que rien n’a changé. */
  protected readonly modifiee = computed(() => {
    const initiales = valeursDe(this.communaute());
    const { nom, description, acces } = this.modele();
    return nom.trim() !== initiales.nom || description.trim() !== initiales.description.trim() || acces !== initiales.acces;
  });
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      const dialogue = this.dialogue().nativeElement;
      dialogue.showModal();
      // Une promo n’a que sa description à changer : le focus y va directement.
      dialogue.querySelector<HTMLElement>(this.automatique() ? '#description-communaute' : '#nom-communaute')?.focus();
    });
  }

  protected choisirAcces(acces: AccesCommunaute): void {
    this.modele.update((valeurs) => ({ ...valeurs, acces }));
  }

  protected fermer(): void {
    if (this.envoi()) return;
    this.dialogue().nativeElement.close();
  }

  /** Échap ferme la fenêtre, sauf pendant un envoi. */
  protected surAnnulation(evenement: Event): void {
    if (this.envoi()) evenement.preventDefault();
  }

  protected async enregistrer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    await submit(this.formulaire, async () => {
      this.envoi.set(true);
      this.erreur.set(null);
      try {
        const resultat = await firstValueFrom(this.requete());
        this.envoi.set(false);
        this.enregistree.emit(resultat);
        this.dialogue().nativeElement.close();
      } catch (erreur: unknown) {
        this.envoi.set(false);
        this.erreur.set(messageServeur(erreur, 'L’enregistrement n’a pas abouti. Réessayez.'));
      }
      return undefined;
    });
    this.focaliserPremierChampInvalide();
  }

  /** Un envoi refusé par la validation met le focus sur le premier champ à corriger. */
  private focaliserPremierChampInvalide(): void {
    const selecteur = !this.automatique() && this.formulaire.nom().invalid() ? '#nom-communaute'
      : this.formulaire.description().invalid() ? '#description-communaute' : null;
    if (selecteur) this.dialogue().nativeElement.querySelector<HTMLElement>(selecteur)?.focus();
  }

  private requete() {
    const { nom, description, categorie, acces } = this.modele();
    const communaute = this.communaute();
    if (!communaute) return this.service.creer({ nom: nom.trim(), description: description.trim(), categorie, acces });
    const modification: ModificationCommunaute = communaute.automatique
      ? { description: description.trim() }
      : { nom: nom.trim(), description: description.trim(), acces };
    return this.service.modifier(communaute.id, modification);
  }
}
