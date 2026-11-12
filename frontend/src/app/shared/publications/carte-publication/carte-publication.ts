import { DatePipe } from '@angular/common';
import { afterNextRender, Component, computed, inject, input, linkedSignal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { estLinkedin } from '../../../core/services/publications/apercu-lien';
import { AudiencePublication, Publication } from '../../../core/services/publications/publication';
import { DateRelativePipe } from '../../dates/date-relative';
import { MoisCourtPipe } from '../../dates/mois-court';
import { AvatarMembre } from '../../images/avatar-membre';
import { ImagePublication } from '../../images/image-publication/image-publication';
import { BoutonJaime } from '../bouton-jaime/bouton-jaime';
import { CommentairesPublication } from '../commentaires-publication/commentaires-publication';
import { MenuPublication } from '../menu-publication/menu-publication';
import { MessageCommentaire } from '../message-commentaire/message-commentaire';
import { ApercuArticle } from './apercu-article';
import { LienPublication } from './lien-publication';

const AUDIENCES: Record<AudiencePublication, string> = {
  TOUS: '',
  ALUMNI: 'Visible par les alumni',
  ETUDIANTS: 'Visible par les étudiants',
};

/** Au-delà, le texte est coupé dans le fil et « Voir plus » mène à la publication complète. */
const LONGUEUR_APERCU = 280;
const LIGNES_APERCU = 5;

/** Éléments qui gardent leur propre comportement quand on clique sur une carte du fil. */
const INTERACTIFS = 'a, button, input, textarea, select, label, dialog, [role="menu"]';

/**
 * Une publication. Dans le fil (`complete` faux) : texte coupé, dernier commentaire en aperçu, et la carte
 * mène à la publication complète. Sur la page de la publication : tout le texte et toute la discussion.
 */
@Component({
  selector: 'app-carte-publication',
  imports: [DatePipe, DateRelativePipe, MoisCourtPipe, RouterLink, AvatarMembre, ImagePublication, BoutonJaime, CommentairesPublication,
    MenuPublication, MessageCommentaire, LienPublication, ApercuArticle],
  templateUrl: './carte-publication.html',
  styleUrl: './carte-publication.scss',
})
export class CartePublication {
  readonly publication = input.required<Publication>();
  readonly complete = input(false);
  /** Page complète ouverte depuis « Commenter » du fil : le curseur va directement dans la saisie. */
  readonly commenterAuChargement = input(false);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fil = viewChild(CommentairesPublication);

  /** Un article s’ouvre sur sa page de lecture, qui porte aussi sa discussion. */
  protected readonly lien = computed(() => {
    const article = this.publication().article;
    return article ? ['/articles', article.id] : ['/publications', this.publication().id];
  });
  protected readonly nombreJaime = linkedSignal(() => this.publication().nombreJaime);
  protected readonly jaime = linkedSignal(() => this.publication().jaime);
  protected readonly nombreCommentaires = linkedSignal(() => this.publication().nombreCommentaires);
  protected readonly discussionOuverte = linkedSignal(() => this.complete());

  protected readonly auteur = computed(() =>
    `${this.publication().auteurPrenom ?? ''} ${this.publication().auteurNom ?? ''}`.trim() || 'Membre EPT');
  protected readonly role = computed(() => LIBELLES_ROLE_COMPTE[this.publication().auteurRole as RoleCompte] ?? '');
  protected readonly audience = computed(() => AUDIENCES[this.publication().audience]);
  protected readonly lienLinkedin = computed(() => estLinkedin(this.publication().lien?.url, this.publication().lien?.site));
  /**
   * Le message reprend le texte de la page liée (publication LinkedIn importée, par exemple) : le lien devient une
   * simple mention de la source, au lieu d’une carte qui répéterait le début du message.
   */
  protected readonly lienEnSource = computed(() => {
    const lien = this.publication().lien;
    if (!lien) return false;
    if (this.lienLinkedin()) return true;
    const resume = (texte: string | null | undefined) => (texte ?? '').replace(/…$/, '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const contenu = this.publication().contenu.replace(/\s+/g, ' ');
    const titre = resume(lien.titre);
    const description = resume(lien.description);
    return (!!titre && contenu.includes(titre)) || (!!description && contenu.includes(description));
  });
  protected readonly estAuteur = computed(() => this.authService.utilisateur()?.id === this.publication().auteurId);
  protected readonly tronque = computed(() => {
    if (this.complete()) return false;
    const contenu = this.publication().contenu;
    return contenu.length > LONGUEUR_APERCU || contenu.split('\n').length > LIGNES_APERCU;
  });
  /** Un appel à projet reste ouvert jusqu’à sa date limite incluse (dates locales AAAA-MM-JJ). */
  protected readonly appelClos = computed(() => {
    const limite = this.publication().dateLimite;
    return !!limite && limite < CartePublication.aujourdhui();
  });

  constructor() {
    afterNextRender(() => { if (this.complete() && this.commenterAuChargement()) this.fil()?.ecrire(); });
  }

  /** Commenter : sur la page complète on écrit tout de suite, depuis le fil on y va d’abord. */
  protected commenter(): void {
    if (this.complete()) this.fil()?.ecrire();
    else void this.router.navigate(this.lien(), { queryParams: { commenter: 1 } });
  }

  /**
   * Un clic n’importe où sur une carte du fil ouvre la publication, comme sur un réseau social.
   * Au clavier, les liens explicites (date, « Voir plus », commentaires) offrent le même accès.
   */
  protected ouvrirDepuisCarte(event: MouseEvent): void {
    if (this.complete() || event.defaultPrevented || event.button !== 0) return;
    const cible = event.target as Element | null;
    if (cible?.closest(INTERACTIFS)) return;
    if (cible?.ownerDocument.defaultView?.getSelection()?.toString()) return;
    void this.router.navigate(this.lien());
  }

  private static aujourdhui(): string {
    const maintenant = new Date();
    const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
    const jour = String(maintenant.getDate()).padStart(2, '0');
    return `${maintenant.getFullYear()}-${mois}-${jour}`;
  }
}
