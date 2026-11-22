import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CommunauteADecouvrir, estCommunauteAutomatique, ICONES_CATEGORIE, LIBELLES_CATEGORIE } from '../../../core/services/models/messagerie.model';
import { DateRelativePipe } from '../../../shared/dates/date-relative';
import { apercuConversation } from '../apercu';
import { AvatarGroupe } from '../avatar-groupe';
import { EtatCommunautes } from '../etat-communautes';
import { messageServeur } from '../message-erreur';

/**
 * Onglet « Communautés » : celles dont je fais partie (promo, filière, puis celles que j’ai rejointes),
 * et celles que je peux rejoindre, avec le nombre de membres de ma promo qui y sont déjà.
 */
@Component({
  selector: 'app-liste-communautes',
  imports: [RouterLink, RouterLinkActive, AvatarGroupe, DateRelativePipe],
  templateUrl: './liste-communautes.html',
  styleUrl: './liste-communautes.scss',
})
export class ListeCommunautes {
  protected readonly etat = inject(EtatCommunautes);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly libelles = LIBELLES_CATEGORIE;
  protected readonly icones = ICONES_CATEGORIE;

  /** Communauté en train d’être rejointe, et l’erreur éventuelle de la dernière tentative. */
  protected readonly enCours = signal<string | null>(null);
  protected readonly erreurRejoindre = signal<{ id: string; message: string } | null>(null);

  protected readonly lignes = computed(() => {
    const moi = this.authService.utilisateur()?.id;
    return this.etat.miennes().map((conversation) => {
      const nombre = conversation.nombreParticipants;
      const nature = conversation.categorie ? LIBELLES_CATEGORIE[conversation.categorie] : 'Communauté';
      // Tant que personne n’a écrit (au plus des arrivées et des départs), la ligne présente la communauté :
      // « Promo · 11 membres » dit plus qu’un « Vous avez rejoint la com… » coupé.
      const ecrit = conversation.dernierMessage && !conversation.dernierMessage.systeme;
      return {
        conversation,
        nature,
        apercu: ecrit ? apercuConversation(conversation, moi) : `${nature} · ${nombre} membre${nombre > 1 ? 's' : ''}`,
        presentation: !ecrit,
        nonLus: conversation.nombreNonLus > 99 ? '99+' : String(conversation.nombreNonLus),
      };
    });
  });

  protected estAutomatique(communaute: CommunauteADecouvrir): boolean {
    return estCommunauteAutomatique(communaute.categorie);
  }

  /** Membres de ma promo, à mettre en avant ; rien dans une communauté de promo, où tous en sont. */
  protected deMaPromo(communaute: CommunauteADecouvrir): number {
    const toutesDeLaPromo = communaute.categorie === 'PROMO' || communaute.categorie === 'PROMO_FILIERE';
    return toutesDeLaPromo ? 0 : communaute.membresDeMaPromo;
  }

  /** Nombre total de membres ; ceux de ma promo sont mis en avant à part dans le gabarit. */
  protected membres(communaute: CommunauteADecouvrir): string {
    return `${communaute.nombreMembres} membre${communaute.nombreMembres > 1 ? 's' : ''}`;
  }

  protected rejoindre(communaute: CommunauteADecouvrir): void {
    if (this.enCours()) return;
    this.enCours.set(communaute.id);
    this.erreurRejoindre.set(null);
    this.etat.rejoindre(communaute.id).subscribe({
      next: (detail) => {
        this.enCours.set(null);
        void this.router.navigate(['/messagerie', detail.id]);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(null);
        this.erreurRejoindre.set({
          id: communaute.id,
          message: messageServeur(erreur, 'Impossible de rejoindre cette communauté. Réessayez.'),
        });
      },
    });
  }
}
