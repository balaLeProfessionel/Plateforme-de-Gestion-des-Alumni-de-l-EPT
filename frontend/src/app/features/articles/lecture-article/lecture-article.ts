import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, inject, Injector, linkedSignal, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Observable } from 'rxjs';
import { Article, ArticleService, LIBELLES_THEME } from '../../../core/services/articles/article';
import { LIBELLES_ROLE_COMPTE, RoleCompte } from '../../../core/services/models/admin.model';
import { ContenuArticle } from '../../../shared/articles/contenu-article';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { ImagePublication } from '../../../shared/images/image-publication/image-publication';
import { BoutonJaime } from '../../../shared/publications/bouton-jaime/bouton-jaime';
import { CommentairesPublication } from '../../../shared/publications/commentaires-publication/commentaires-publication';
import { MenuPublication } from '../../../shared/publications/menu-publication/menu-publication';

/**
 * Lecture d’un article. Son auteur y voit aussi son brouillon et peut le modifier, le publier ou le supprimer ;
 * les « J’aime », commentaires et signalements passent par la publication qui porte l’article dans le fil.
 */
@Component({
  selector: 'app-lecture-article',
  imports: [DatePipe, RouterLink, ButtonDirective, ButtonIcon, ButtonLabel, Message, Skeleton, Tag, BoutonRetour, AvatarMembre, ImagePublication, ContenuArticle, BoutonJaime,
    CommentairesPublication, MenuPublication],
  templateUrl: './lecture-article.html',
  styleUrl: './lecture-article.scss',
})
export class LectureArticle {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ArticleService);
  private readonly injector = inject(Injector);
  private readonly discussion = viewChild(CommentairesPublication);
  private id = '';
  /** Arrivée depuis « Commenter » dans le fil : la saisie du commentaire reçoit le focus. */
  private readonly commenterAuChargement = this.route.snapshot.queryParamMap.has('commenter');

  protected readonly article = signal<Article | undefined>(undefined);
  private readonly echec = signal<'introuvable' | 'erreur' | undefined>(undefined);
  protected readonly etat = computed(() => this.echec() ?? (this.article() ? 'pret' : 'chargement'));
  protected readonly themes = LIBELLES_THEME;
  protected readonly auteur = computed(() => {
    const a = this.article();
    return `${a?.auteurPrenom ?? ''} ${a?.auteurNom ?? ''}`.trim() || 'Membre EPT';
  });
  protected readonly role = computed(() => LIBELLES_ROLE_COMPTE[this.article()?.auteurRole as RoleCompte] ?? '');
  protected readonly nombreJaime = linkedSignal(() => this.article()?.nombreJaime ?? 0);
  protected readonly jaime = linkedSignal(() => this.article()?.jaime ?? false);
  protected readonly nombreCommentaires = linkedSignal(() => this.article()?.nombreCommentaires ?? 0);
  protected readonly discussionOuverte = signal(true);

  protected readonly actionEnCours = signal(false);
  protected readonly confirmationSuppression = signal(false);
  protected readonly messageAction = signal<string | null>(null);
  protected readonly messageSucces = signal<string | null>(null);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((parametres) => {
      this.id = parametres.get('id') ?? '';
      this.charger();
    });
  }

  protected charger(): void {
    this.article.set(undefined);
    this.echec.set(undefined);
    this.service.obtenir(this.id).subscribe({
      next: (article) => {
        this.article.set(article);
        if (this.commenterAuChargement && article.publicationId) {
          afterNextRender(() => this.discussion()?.ecrire(), { injector: this.injector });
        }
      },
      error: (erreur: HttpErrorResponse) => this.echec.set(erreur.status === 404 ? 'introuvable' : 'erreur'),
    });
  }

  protected commenter(): void {
    this.discussion()?.ecrire();
  }

  protected publier(): void {
    this.lancer(this.service.publier(this.id), (article) => {
      this.article.set(article);
      this.messageSucces.set('Votre article est publié : il apparaît dans le fil et dans la bibliothèque.');
    });
  }

  protected supprimer(): void {
    this.lancer(this.service.supprimer(this.id), () => {
      void this.router.navigate(['/articles'], { queryParams: { vue: 'mes' } });
    });
  }

  private lancer<T>(requete: Observable<T>, succes: (resultat: T) => void): void {
    this.actionEnCours.set(true);
    this.messageAction.set(null);
    this.messageSucces.set(null);
    requete.subscribe({
      next: (resultat) => { this.actionEnCours.set(false); this.confirmationSuppression.set(false); succes(resultat); },
      error: (erreur: HttpErrorResponse) => {
        this.actionEnCours.set(false);
        this.messageAction.set(erreur.error?.message ?? 'L’opération a échoué. Réessayez.');
      },
    });
  }
}
