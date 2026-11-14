import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { LONGUEUR_MAX_MESSAGE, Message } from '../../../core/services/models/messagerie.model';

/** Le compteur de caractères n’apparaît qu’à l’approche de la limite. */
const SEUIL_COMPTEUR = LONGUEUR_MAX_MESSAGE - 200;

/** Zone d’écriture du fil : Entrée envoie, Maj+Entrée va à la ligne. */
@Component({
  selector: 'app-zone-saisie',
  imports: [FormField],
  templateUrl: './zone-saisie.html',
  styleUrl: './zone-saisie.scss',
})
export class ZoneSaisie {
  private readonly messagerie = inject(MessagerieService);
  /** Écran tactile : Entrée va à la ligne, comme dans les messageries mobiles ; on envoie avec le bouton. */
  private readonly tactile = inject(DOCUMENT).defaultView?.matchMedia?.('(hover: none)').matches ?? false;
  private readonly champ = viewChild.required<ElementRef<HTMLTextAreaElement>>('champ');
  readonly conversationId = input.required<string>();
  readonly envoye = output<Message>();

  protected readonly modele = signal({ contenu: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.contenu, LONGUEUR_MAX_MESSAGE,
      { message: `Un message ne peut pas dépasser ${LONGUEUR_MAX_MESSAGE} caractères.` });
    validate(champ.contenu, ({ value }) => value().trim() === '' ? { kind: 'vide', message: 'Écrivez un message.' } : undefined);
  });
  protected readonly longueur = computed(() => this.modele().contenu.length);
  protected readonly afficherCompteur = computed(() => this.longueur() >= SEUIL_COMPTEUR);
  protected readonly tropLong = computed(() => this.longueur() > LONGUEUR_MAX_MESSAGE);
  protected readonly vide = computed(() => this.modele().contenu.trim() === '');
  protected readonly erreur = signal<string | null>(null);
  protected readonly maximum = LONGUEUR_MAX_MESSAGE;

  /** Entrée envoie ; Maj+Entrée, l’écran tactile et la composition d’un caractère (IME) gardent le retour à la ligne. */
  protected toucheEntree(evenement: Event): void {
    const clavier = evenement as KeyboardEvent;
    if (this.tactile || clavier.shiftKey || clavier.isComposing) return;
    evenement.preventDefault();
    void this.envoyer();
  }

  protected async envoyer(evenement?: Event): Promise<void> {
    evenement?.preventDefault();
    if (this.vide() || this.tropLong() || this.formulaire().submitting()) return;
    await submit(this.formulaire, async () => {
      this.erreur.set(null);
      try {
        const message = await firstValueFrom(this.messagerie.envoyer(this.conversationId(), this.modele().contenu.trim()));
        this.modele.set({ contenu: '' });
        this.formulaire().reset();
        this.envoye.emit(message);
      } catch (erreur) {
        this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
          ? erreur.error.message : 'Le message n’a pas pu être envoyé. Réessayez.');
      }
      this.champ().nativeElement.focus();
      return undefined;
    });
  }
}
