import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tag } from 'primeng/tag';
import { LIBELLES_THEME, ResumeArticle } from '../../core/services/articles/article';
import { AvatarMembre } from '../images/avatar-membre';
import { ImagePublication } from '../images/image-publication/image-publication';

/** Un article dans la bibliothèque ou dans « Mes articles » : toute la carte mène à sa page. */
@Component({
  selector: 'app-carte-article',
  imports: [DatePipe, RouterLink, Tag, AvatarMembre, ImagePublication],
  host: { class: 'carte-cliquable' },
  template: `
    @let a = article();
    <div class="visuel" [attr.data-theme]="a.theme">
      @if (a.urlCouverture) {
        <app-image-publication [url]="a.urlCouverture" description="" />
      } @else {
        <i class="pi pi-book" aria-hidden="true"></i>
      }
    </div>
    <div class="texte">
      <p class="meta-haut">
        <span class="theme">{{ themes[a.theme] }}</span>
        @if (avecStatut()) {
          <p-tag class="statut" rounded [severity]="a.statut === 'BROUILLON' ? 'secondary' : 'success'"
            [value]="a.statut === 'BROUILLON' ? 'Brouillon' : 'Publié'" />
        }
        <span class="duree">{{ a.tempsLecture }} min</span>
      </p>
      <h3><a class="lien-etire" [routerLink]="['/articles', a.id]">{{ a.titre }}</a></h3>
      @if (a.resume) { <p class="resume">{{ a.resume }}</p> }
      @if (avecStatut()) {
        <p class="pied">Modifié le {{ a.modifieLe | date:'d MMMM y' }}</p>
      } @else {
        <p class="pied auteur">
          <app-avatar-membre [urlPhoto]="a.auteurPhoto" [nom]="a.auteurNom" [prenom]="a.auteurPrenom"
            [roleMembre]="a.auteurRole" [taille]="1.6" />
          <span>{{ auteur() }}</span>
          @if (a.publieLe) { <span aria-hidden="true">·</span> <time [attr.datetime]="a.publieLe">{{ a.publieLe | date:'d MMM y' }}</time> }
        </p>
      }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius); background: var(--ept-surface); transition: border-color .15s; }
    :host:hover { border-color: #b7cdd8; }
    .visuel { display: grid; place-items: center; width: 100%; aspect-ratio: 16 / 9; background: var(--ept-primary-light);
      color: var(--ept-primary); }
    .visuel i { font-size: 1.8rem; opacity: .55; }
    .visuel[data-theme='CARRIERE'] { background: #e6f0f6; }
    .visuel[data-theme='ENTREPRENEURIAT'] { background: #e8f3ef; color: var(--ept-success-dark); }
    .visuel[data-theme='RECHERCHE'] { background: #ecebf6; color: #4a4785; }
    .visuel[data-theme='VIE_ECOLE'] { background: #e9f8fc; }
    .visuel app-image-publication { border-radius: 0; }
    .texte { display: flex; flex: 1 1 auto; flex-direction: column; gap: .4rem; padding: .9rem 1rem 1rem; min-width: 0; }
    .meta-haut { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin: 0; font-size: .78rem; font-weight: 600; }
    .theme { color: var(--ept-primary); }
    .duree { margin-left: auto; color: var(--ept-text-secondary); font-weight: 500; }
    .statut { font-size: .72rem; }
    h3 { margin: 0; font-family: var(--ept-font-heading); font-size: 1.05rem; line-height: 1.3; overflow-wrap: anywhere; }
    h3 a { color: var(--ept-primary-dark); text-decoration: none; }
    :host:hover h3 a { text-decoration: underline; }
    .resume { display: -webkit-box; margin: 0; overflow: hidden; color: #3d5566; font-size: .9rem; line-height: 1.5;
      -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; }
    .pied { display: flex; align-items: center; gap: .4rem; margin: auto 0 0; padding-top: .35rem; color: var(--ept-text-secondary);
      font-size: .8rem; }
    .auteur span:first-of-type { overflow: hidden; color: var(--ept-primary-dark); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
  `,
})
export class CarteArticle {
  readonly article = input.required<ResumeArticle>();
  /** Dans « Mes articles » : statut et date de modification à la place de l’auteur. */
  readonly avecStatut = input(false);
  protected readonly themes = LIBELLES_THEME;
  protected readonly auteur = computed(() =>
    `${this.article().auteurPrenom ?? ''} ${this.article().auteurNom ?? ''}`.trim() || 'Membre EPT');
}
