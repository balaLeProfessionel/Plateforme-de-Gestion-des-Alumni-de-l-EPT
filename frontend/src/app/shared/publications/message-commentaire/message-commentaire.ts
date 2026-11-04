import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { CommentairePublication } from '../../../core/services/publications/publication';
import { AvatarMembre } from '../../images/avatar-membre';

/**
 * Un commentaire, sans bulle : avatar aux couleurs du rôle, nom, rôle, texte, heure et « Répondre » (facultatif).
 * Seuls les commentaires du membre connecté sont posés sur un fond bleu clair, pour qu’il s’y retrouve.
 */
@Component({
  selector: 'app-message-commentaire',
  imports: [DatePipe, AvatarMembre],
  template: `
    @let c = commentaire();
    <article class="message" [class.reponse]="reponse()" [class.moi]="estMoi()">
      <app-avatar-membre [urlPhoto]="c.auteurPhoto" [nom]="c.auteurNom" [prenom]="c.auteurPrenom"
        [roleMembre]="c.auteurRole" [taille]="reponse() ? 1.75 : 2.25" />
      <div class="corps">
        <div class="bulle">
          <p class="auteur"><strong>{{ nom() }}</strong>
            @if (role()) { <span class="role">{{ role() }}</span> }</p>
          <p class="texte" [class.apercu]="apercu()">{{ c.contenu }}</p>
        </div>
        <p class="pied">
          <time [attr.datetime]="c.creeLe">{{ c.creeLe | date:'d MMM, HH:mm' }}</time>
          @if (repondable()) {
            <button type="button" class="repondre" (click)="repondre.emit(c)" [attr.aria-label]="'Répondre à ' + nom()">Répondre</button>
          }
        </p>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    p { margin: 0; }
    .message { display: flex; align-items: flex-start; gap: .6rem; min-width: 0; }
    .corps { min-width: 0; flex: 1 1 auto; }
    .moi { margin: -.45rem -.55rem; padding: .45rem .55rem; border-radius: var(--ept-radius-sm); background: var(--ept-primary-light); }
    .auteur { display: flex; flex-wrap: wrap; align-items: baseline; gap: .1rem .5rem; font-size: .88rem; }
    .auteur strong { color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-weight: 600; overflow-wrap: anywhere; }
    .role { color: var(--ept-text-secondary); font-size: .78rem; }
    .texte { margin-top: .1rem; color: #1d3a4b; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; }
    /* Dans le fil, l’aperçu tient en deux lignes ; la publication complète montre tout. */
    .texte.apercu { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
    .pied { display: flex; align-items: center; gap: .75rem; margin-top: .05rem; font-size: .8rem; }
    .pied time { color: var(--ept-text-secondary); }
    .repondre { padding: .35rem .2rem; border: 0; background: transparent; color: var(--ept-primary); font: inherit;
      font-size: .8rem; font-weight: 600; cursor: pointer; }
    .repondre:hover { text-decoration: underline; }
    .repondre:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
  `,
})
export class MessageCommentaire {
  readonly commentaire = input.required<CommentairePublication>();
  readonly reponse = input(false);
  readonly repondable = input(true);
  readonly apercu = input(false);
  readonly repondre = output<CommentairePublication>();

  private readonly utilisateur = inject(AuthService).utilisateur;
  protected readonly estMoi = computed(() => this.utilisateur()?.id === this.commentaire().auteurId);

  protected readonly nom = computed(() =>
    `${this.commentaire().auteurPrenom ?? ''} ${this.commentaire().auteurNom ?? ''}`.trim() || 'Membre EPT');
  protected readonly role = computed(() => LIBELLES_ROLE_COMPTE[this.commentaire().auteurRole as RoleCompte] ?? '');
}
