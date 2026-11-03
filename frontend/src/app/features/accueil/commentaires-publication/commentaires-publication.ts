import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { CommentairePublication, PublicationService } from '../../../core/services/publications/publication';

@Component({
  selector: 'app-commentaires-publication',
  imports: [DatePipe, FormField],
  template: `
    <section class="commentaires" [attr.aria-label]="'Commentaires de la publication'">
      <div class="actions-commentaires">
        <button type="button" class="compteur" [attr.aria-expanded]="ouverte()" (click)="basculer()">
          @if (total()) { {{ total() }} commentaire{{ total() === 1 ? '' : 's' }} } @else { Commentaires }
        </button>
        <button type="button" class="ouvrir" [attr.aria-expanded]="ouverte()" (click)="basculer()">
          <i class="pi pi-comment" aria-hidden="true"></i> {{ ouverte() ? 'Masquer' : 'Commenter' }}
        </button>
      </div>
      @if (ouverte()) {
        @if (chargement()) { <p role="status">Chargement des commentaires…</p> }
        @if (erreurChargement()) { <p role="alert">Impossible de charger les commentaires. <button type="button" (click)="charger(0)">Réessayer</button></p> }
        <ul class="liste">
          @for (commentaire of commentaires(); track commentaire.id) {
            <li [class.reponse]="commentaire.parentId">
              <p class="auteur">{{ commentaire.auteurPrenom }} {{ commentaire.auteurNom }}
                <time [attr.datetime]="commentaire.creeLe">{{ commentaire.creeLe | date:'d MMM y à HH:mm' }}</time>
              </p>
              <p class="texte">{{ commentaire.contenu }}</p>
              @if (!commentaire.parentId) { <button type="button" class="repondre" (click)="repondreA(commentaire)">Répondre</button> }
            </li>
          }
        </ul>
        @if (page() + 1 < totalPages()) {
          <button type="button" class="charger-suite" [disabled]="chargement()" (click)="charger(page() + 1)">Afficher la suite</button>
        }
        <form (submit)="envoyer($event)" novalidate>
          @if (parent()) { <p class="contexte-reponse">Réponse à {{ parent()?.auteurPrenom }} {{ parent()?.auteurNom }}
            <button type="button" (click)="parent.set(undefined)">Annuler</button></p> }
          <label class="visuellement-cache" [for]="'commentaire-' + publicationId()">{{ parent() ? 'Votre réponse' : 'Votre commentaire' }}</label>
          <textarea [id]="'commentaire-' + publicationId()" [formField]="formulaire.contenu" rows="2"
            [placeholder]="parent() ? 'Écrire une réponse…' : 'Écrire un commentaire…'"></textarea>
          @if (erreurEnvoi()) { <p role="alert">{{ erreurEnvoi() }}</p> }
          <button type="submit" class="envoyer" [disabled]="envoi()">{{ envoi() ? 'Envoi…' : (parent() ? 'Répondre' : 'Commenter') }}</button>
        </form>
      }
      @if (succes()) { <p class="succes" role="status">{{ succes() }}</p> }
    </section>
  `,
  styles: `
    :host { display: block; border-top: 1px solid var(--ept-border); margin-top: 1rem; padding-top: .75rem; }
    button { font: inherit; cursor: pointer; }
    button:focus-visible, textarea:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .actions-commentaires { display: flex; justify-content: space-between; align-items: center; gap: .75rem; min-height: 2.5rem; }
    .compteur, .ouvrir, .repondre, .contexte-reponse button { border: 0; background: transparent; color: var(--ept-primary); font-weight: 600; padding: .45rem .3rem; }
    .ouvrir { display: inline-flex; align-items: center; gap: .45rem; }
    .compteur { color: var(--ept-text-secondary); font-weight: 400; }
    .liste { list-style: none; padding: 0; margin: .5rem 0; display: grid; gap: .5rem; }
    .liste li { min-width: 0; background: var(--ept-primary-light); padding: .65rem .8rem; }
    .liste li.reponse { margin-left: 1.25rem; border-left: 3px solid var(--ept-sky); }
    .auteur { font-weight: 700; margin: 0; overflow-wrap: anywhere; }
    time { display: block; color: var(--ept-text-secondary); font-size: .78rem; font-weight: 400; }
    .texte { margin: .35rem 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .charger-suite { border: 1px solid var(--ept-border); color: var(--ept-primary); background: transparent; padding: .5rem .75rem; }
    form { margin-top: .75rem; }
    textarea { width: 100%; box-sizing: border-box; resize: vertical; border: 1px solid var(--ept-border); padding: .65rem; font: inherit; }
    .envoyer { display: block; margin: .5rem 0 0 auto; padding: .55rem .9rem; border: 0; background: var(--ept-primary); color: white; font-weight: 600; }
    .envoyer:disabled { opacity: .6; cursor: wait; }
    .contexte-reponse { display: flex; justify-content: space-between; gap: .5rem; margin: 0 0 .4rem; font-size: .9rem; }
    .succes { color: var(--ept-primary); }
    .visuellement-cache { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 560px) {
      .liste li.reponse { margin-left: .65rem; }
      .actions-commentaires { gap: .35rem; }
      .compteur, .ouvrir { padding-inline: .15rem; font-size: .9rem; }
    }
  `,
})
export class CommentairesPublication {
  readonly publicationId = input.required<string>();
  private readonly service = inject(PublicationService);
  protected readonly ouverte = signal(false);
  protected readonly chargement = signal(false);
  protected readonly erreurChargement = signal(false);
  protected readonly erreurEnvoi = signal('');
  protected readonly succes = signal('');
  protected readonly envoi = signal(false);
  protected readonly commentaires = signal<CommentairePublication[]>([]);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(0);
  protected readonly parent = signal<CommentairePublication | undefined>(undefined);
  protected readonly modele = signal({ contenu: '' });
  protected readonly formulaire = form(this.modele, (champ) => { required(champ.contenu); maxLength(champ.contenu, 2000); });

  protected basculer(): void {
    this.ouverte.update((valeur) => !valeur);
    if (this.ouverte() && !this.commentaires().length && !this.erreurChargement()) this.charger(0);
  }

  protected charger(page: number): void {
    if (this.chargement()) return;
    this.chargement.set(true);
    this.erreurChargement.set(false);
    this.service.listerCommentaires(this.publicationId(), page).subscribe({
      next: (reponse) => {
        this.commentaires.update((precedents) => page === 0 ? reponse.contenu : [...precedents, ...reponse.contenu]);
        this.total.set(reponse.totalElements);
        this.totalPages.set(reponse.totalPages);
        this.page.set(reponse.page);
        this.chargement.set(false);
      },
      error: () => { this.erreurChargement.set(true); this.chargement.set(false); },
    });
  }

  protected repondreA(commentaire: CommentairePublication): void {
    this.parent.set(commentaire);
    this.succes.set('');
  }

  protected envoyer(event: Event): void {
    event.preventDefault();
    const contenu = this.modele().contenu.trim();
    if (this.envoi() || !contenu || this.formulaire().invalid()) {
      this.erreurEnvoi.set('Saisissez un commentaire de 2 000 caractères maximum.');
      return;
    }
    this.envoi.set(true);
    this.erreurEnvoi.set('');
    this.succes.set('');
    this.service.commenter(this.publicationId(), contenu, this.parent()?.id).subscribe({
      next: () => {
        this.modele.set({ contenu: '' });
        this.parent.set(undefined);
        this.succes.set('Votre commentaire a été ajouté.');
        this.envoi.set(false);
        this.charger(0);
      },
      error: (erreur: HttpErrorResponse) => {
        this.erreurEnvoi.set(erreur.status === 404
          ? 'Cette publication ou ce commentaire n’est plus disponible.'
          : 'Impossible d’ajouter le commentaire. Réessayez.');
        this.envoi.set(false);
      },
    });
  }
}
