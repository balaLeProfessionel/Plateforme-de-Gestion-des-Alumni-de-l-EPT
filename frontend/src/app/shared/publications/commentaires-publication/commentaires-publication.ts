import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, input, model, signal, untracked, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CommentairePublication, PublicationService } from '../../../core/services/publications/publication';
import { AvatarMembre } from '../../images/avatar-membre';
import { MessageCommentaire } from '../message-commentaire/message-commentaire';

interface Fil {
  commentaire: CommentairePublication;
  reponses: CommentairePublication[];
}

/**
 * Fil de discussion d’une publication : chaque commentaire et, sous lui, ses réponses (un seul niveau,
 * comme le permet l’API). Le parent ouvre le fil (`ouverte`) et peut demander la saisie avec `ecrire()`.
 */
@Component({
  selector: 'app-commentaires-publication',
  imports: [NgTemplateOutlet, FormField, AvatarMembre, MessageCommentaire],
  templateUrl: './commentaires-publication.html',
  styleUrl: './commentaires-publication.scss',
})
export class CommentairesPublication {
  readonly publicationId = input.required<string>();
  readonly ouverte = model(false);
  /** Nombre total de commentaires, tenu à jour après un envoi pour la ligne de résumé de la carte. */
  readonly nombre = model(0);

  private readonly service = inject(PublicationService);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly saisie = viewChild<ElementRef<HTMLTextAreaElement>>('saisie');

  protected readonly moi = this.authService.utilisateur;
  protected readonly chargement = signal(false);
  protected readonly charge = signal(false);
  protected readonly erreurChargement = signal(false);
  protected readonly erreurEnvoi = signal('');
  protected readonly annonce = signal('');
  protected readonly envoi = signal(false);
  protected readonly commentaires = signal<CommentairePublication[]>([]);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  /** Commentaire auquel on répond ; la zone de saisie s’affiche alors sous son fil. */
  protected readonly parent = signal<CommentairePublication | undefined>(undefined);
  protected readonly modele = signal({ contenu: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.contenu);
    maxLength(champ.contenu, 2000);
  });

  protected readonly fils = computed<Fil[]>(() => {
    const parId = new Map<string, Fil>();
    const fils: Fil[] = [];
    for (const commentaire of this.commentaires()) {
      const racine = commentaire.parentId ? parId.get(commentaire.parentId) : undefined;
      if (racine) {
        racine.reponses.push(commentaire);
      } else {
        // Une réponse dont le parent n’est pas encore chargé s’affiche seule plutôt que de disparaître.
        const fil = { commentaire, reponses: [] };
        parId.set(commentaire.id, fil);
        fils.push(fil);
      }
    }
    return fils;
  });
  protected readonly restants = computed(() => Math.max(0, this.nombre() - this.commentaires().length));

  constructor() {
    effect(() => {
      if (this.ouverte() && untracked(() => !this.charge() && !this.chargement())) untracked(() => this.charger(0));
    });
  }

  /** Ouvre le fil et place le curseur dans la zone de saisie du commentaire. */
  ecrire(): void {
    this.parent.set(undefined);
    this.ouverte.set(true);
    this.focaliserSaisie();
  }

  protected repondreA(commentaire: CommentairePublication): void {
    // On répond toujours dans le fil du commentaire d’origine.
    const racine = commentaire.parentId
      ? this.commentaires().find((c) => c.id === commentaire.parentId) ?? commentaire : commentaire;
    this.parent.set(racine);
    this.annonce.set('');
    this.focaliserSaisie();
  }

  protected annulerReponse(): void {
    this.parent.set(undefined);
    this.focaliserSaisie();
  }

  protected nomDe(commentaire: CommentairePublication): string {
    return `${commentaire.auteurPrenom ?? ''} ${commentaire.auteurNom ?? ''}`.trim() || 'Membre EPT';
  }

  protected charger(page: number): void {
    if (this.chargement()) return;
    this.chargement.set(true);
    this.erreurChargement.set(false);
    this.service.listerCommentaires(this.publicationId(), page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reponse) => {
        this.commentaires.update((precedents) => page === 0 ? reponse.contenu : [...precedents, ...reponse.contenu]);
        this.nombre.set(reponse.totalElements);
        this.totalPages.set(reponse.totalPages);
        this.page.set(reponse.page);
        this.charge.set(true);
        this.chargement.set(false);
      },
      error: () => { this.erreurChargement.set(true); this.chargement.set(false); },
    });
  }

  protected envoyer(event: Event): void {
    event.preventDefault();
    const contenu = this.modele().contenu.trim();
    if (this.envoi()) return;
    if (!contenu || this.formulaire().invalid()) {
      this.erreurEnvoi.set('Saisissez un commentaire de 2 000 caractères maximum.');
      this.focaliserSaisie();
      return;
    }
    const parent = this.parent();
    this.envoi.set(true);
    this.erreurEnvoi.set('');
    this.annonce.set('');
    this.service.commenter(this.publicationId(), contenu, parent?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cree) => {
        this.modele.set({ contenu: '' });
        this.formulaire().reset();
        this.parent.set(undefined);
        this.envoi.set(false);
        this.commentaires.update((liste) => [...liste, cree]);
        this.nombre.update((n) => n + 1);
        this.annonce.set(parent ? 'Votre réponse a été publiée.' : 'Votre commentaire a été publié.');
        // La saisie de réponse disparaît avec l’envoi : le focus rejoint la saisie principale.
        if (parent) this.focaliserSaisie();
      },
      error: (erreur: HttpErrorResponse) => {
        this.erreurEnvoi.set(erreur.status === 404
          ? 'Cette publication ou ce commentaire n’est plus disponible.'
          : 'Impossible de publier le commentaire. Réessayez.');
        this.envoi.set(false);
      },
    });
  }

  /**
   * Entrée publie, comme dans une messagerie ; Maj+Entrée va à la ligne. Pendant une saisie avec un éditeur de
   * méthode d’entrée (accents composés, clavier asiatique), Entrée valide le caractère et ne publie pas.
   */
  protected raccourci(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    this.envoyer(event);
  }

  private focaliserSaisie(): void {
    afterNextRender(() => this.saisie()?.nativeElement.focus(), { injector: this.injector });
  }
}
