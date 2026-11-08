import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_THEME } from '../../../core/services/articles/article';
import { ArticlePublication } from '../../../core/services/publications/publication';
import { ImagePublication } from '../../images/image-publication/image-publication';

/** Un article dans le fil : sa couverture, son thème, son titre et son résumé, puis « Lire l’article ». */
@Component({
  selector: 'app-apercu-article',
  imports: [RouterLink, ImagePublication],
  template: `
    @if (couverture()) {
      <div class="couverture"><app-image-publication [url]="couverture()!" description="" /></div>
    }
    <div class="texte">
      <p class="etiquette"><i class="pi pi-book" aria-hidden="true"></i> Article · {{ themes[article().theme] }}
        · {{ article().tempsLecture }} min de lecture</p>
      <h3>{{ titre() }}</h3>
      @if (resume()) { <p class="resume">{{ resume() }}</p> }
      <a class="lire" [routerLink]="['/articles', article().id]">Lire l’article<span class="cache"> « {{ titre() }} »</span>
        <i class="pi pi-arrow-right" aria-hidden="true"></i></a>
    </div>
  `,
  styles: `
    :host { display: block; margin: .75rem var(--marge, 1rem) 0; overflow: hidden; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius-sm); background: var(--ept-surface); }
    .couverture { width: 100%; aspect-ratio: 16 / 9; }
    .couverture app-image-publication { border-radius: 0; }
    .texte { display: grid; gap: .35rem; padding: .85rem 1rem 1rem; }
    .etiquette { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; margin: 0; color: var(--ept-primary);
      font-size: .8rem; font-weight: 600; }
    h3 { margin: 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.15rem; line-height: 1.3; }
    .resume { display: -webkit-box; margin: 0; overflow: hidden; color: #3d5566; line-height: 1.5;
      -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; }
    .lire { display: inline-flex; align-items: center; justify-self: start; gap: .4rem; margin-top: .25rem;
      color: var(--ept-primary); font-weight: 600; text-decoration: none; }
    .lire .pi { font-size: .75rem; }
    .lire:hover { text-decoration: underline; }
    .lire:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; border-radius: .15rem; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class ApercuArticle {
  readonly article = input.required<ArticlePublication>();
  readonly titre = input.required<string>();
  readonly resume = input('');
  readonly couverture = input<string | null>(null);
  protected readonly themes = LIBELLES_THEME;
}
