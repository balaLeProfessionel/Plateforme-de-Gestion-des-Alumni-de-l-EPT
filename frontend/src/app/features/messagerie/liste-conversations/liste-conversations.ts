import { Component, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { DateRelativePipe } from '../../../shared/dates/date-relative';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { apercuConversation } from '../apercu';
import { EtatConversations } from '../etat-conversations';

/** Colonne des conversations, la plus récente en premier, avec ses quatre états. */
@Component({
  selector: 'app-liste-conversations',
  imports: [RouterLink, RouterLinkActive, AvatarMembre, DateRelativePipe],
  templateUrl: './liste-conversations.html',
  styleUrl: './liste-conversations.scss',
})
export class ListeConversations {
  protected readonly etat = inject(EtatConversations);
  private readonly authService = inject(AuthService);
  private readonly moiId = computed(() => this.authService.utilisateur()?.id);
  readonly nouvelle = output<void>();

  protected readonly lignes = computed(() => {
    const moi = this.moiId();
    return this.etat.conversations().map((conversation) => ({
      conversation,
      apercu: apercuConversation(conversation, moi),
      nonLus: conversation.nombreNonLus > 99 ? '99+' : String(conversation.nombreNonLus),
    }));
  });
}
