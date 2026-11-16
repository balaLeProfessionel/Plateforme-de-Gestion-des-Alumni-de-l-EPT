import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { Message } from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PieceJointeMessage } from '../piece-jointe/piece-jointe-message';

/**
 * Une bulle du fil : les miennes à droite, celles des autres à gauche (avec le nom de l’auteur dans un groupe).
 * L’auteur peut supprimer son message après confirmation dans la bulle ; il reste affiché « Message supprimé ».
 */
@Component({
  selector: 'app-message-fil',
  imports: [AvatarMembre, DatePipe, PieceJointeMessage],
  templateUrl: './message-fil.html',
  styleUrl: './message-fil.scss',
  host: {
    '[class.de-moi]': 'message().deMoi',
    '[class.suite]': 'suite()',
  },
})
export class MessageFil {
  private readonly messagerie = inject(MessagerieService);
  readonly message = input.required<Message>();
  readonly conversationId = input.required<string>();
  /** Dans un groupe, le nom de l’auteur s’affiche au-dessus de sa première bulle. */
  readonly groupe = input(false);
  readonly suite = input(false);
  readonly supprime = output<string>();

  protected readonly confirmation = signal(false);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected supprimer(): void {
    this.enCours.set(true);
    this.erreur.set(null);
    this.messagerie.supprimerMessage(this.conversationId(), this.message().id).subscribe({
      next: () => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.supprime.emit(this.message().id);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'La suppression a échoué. Réessayez.');
      },
    });
  }
}
