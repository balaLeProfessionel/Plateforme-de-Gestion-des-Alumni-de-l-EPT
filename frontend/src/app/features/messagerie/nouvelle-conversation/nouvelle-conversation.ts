import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, submit, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { LONGUEUR_MAX_NOM_GROUPE, MembreChoisi } from '../../../core/services/models/messagerie.model';
import { EtatConversations } from '../etat-conversations';
import { SelectionMembres } from '../selection-membres/selection-membres';

/**
 * Fenêtre « Nouvelle conversation » : un membre choisi ouvre la conversation directe,
 * plusieurs membres et un nom créent un groupe dont je suis administrateur.
 */
@Component({
  selector: 'app-nouvelle-conversation',
  imports: [FormField, SelectionMembres],
  templateUrl: './nouvelle-conversation.html',
  styleUrl: './nouvelle-conversation.scss',
})
export class NouvelleConversation {
  private readonly messagerie = inject(MessagerieService);
  private readonly etat = inject(EtatConversations);
  private readonly router = inject(Router);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  private readonly selection = viewChild.required(SelectionMembres);
  readonly ouverte = input(false);
  readonly fermee = output<void>();

  protected readonly choisis = signal<MembreChoisi[]>([]);
  protected readonly groupe = computed(() => this.choisis().length >= 2);
  protected readonly modele = signal({ nom: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.nom, LONGUEUR_MAX_NOM_GROUPE,
      { message: `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_GROUPE} caractères.` });
    validate(champ.nom, ({ value }) => this.groupe() && value().trim() === ''
      ? { kind: 'requis', message: 'Donnez un nom au groupe.' } : undefined);
  });
  protected readonly erreur = signal<string | null>(null);
  protected readonly libelleAction = computed(() => {
    const choisis = this.choisis();
    if (choisis.length >= 2) return 'Créer le groupe';
    if (choisis.length === 1) return `Écrire à ${choisis[0].prenom ?? choisis[0].nom}`;
    return 'Choisissez un membre';
  });
  protected readonly longueurMaxNom = LONGUEUR_MAX_NOM_GROUPE;

  constructor() {
    effect(() => {
      const dialogue = this.dialogue().nativeElement;
      if (this.ouverte()) {
        if (!dialogue.open) {
          this.reinitialiser();
          dialogue.showModal();
        }
      } else if (dialogue.open) {
        dialogue.close();
      }
    });
  }

  protected async valider(evenement: Event): Promise<void> {
    evenement.preventDefault();
    if (this.choisis().length === 0) return;
    await submit(this.formulaire, async () => {
      this.erreur.set(null);
      try {
        const choisis = this.choisis();
        const id = choisis.length === 1
          ? (await firstValueFrom(this.messagerie.ouvrirDirecte(choisis[0].id))).id
          : (await firstValueFrom(this.messagerie.creerGroupe(this.modele().nom.trim(), choisis.map((m) => m.id)))).id;
        this.etat.actualiser();
        this.dialogue().nativeElement.close();
        await this.router.navigate(['/messagerie', id]);
      } catch (erreur) {
        this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
          ? erreur.error.message : 'La conversation n’a pas pu être ouverte. Réessayez.');
      }
      return undefined;
    });
    // Nom manquant : le focus va au champ en erreur.
    if (this.formulaire.nom().invalid()) this.dialogue().nativeElement.querySelector<HTMLInputElement>('#nom-groupe')?.focus();
  }

  private reinitialiser(): void {
    this.choisis.set([]);
    this.modele.set({ nom: '' });
    this.formulaire().reset();
    this.erreur.set(null);
    this.selection().vider();
  }
}
