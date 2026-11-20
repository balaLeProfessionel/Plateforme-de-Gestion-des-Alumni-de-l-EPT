import { Component, computed, input } from '@angular/core';
import { estLinkedin } from '../../../core/services/publications/apercu-lien';
import { LienPublication as Lien } from '../../../core/services/publications/publication';

/**
 * Le lien joint à une publication, sous l’une de ses deux formes : une simple ligne de source quand le message
 * reprend le texte de la page (« Publié à l’origine sur LinkedIn · Voir l’original »), sinon une carte sobre qui dit
 * où l’on va avant de quitter la plateforme. Les deux s’ouvrent dans un nouvel onglet.
 */
@Component({
  selector: 'app-lien-publication',
  template: `
    @let l = lien();
    @if (source()) {
      <a class="source" [class.linkedin]="linkedin()" [href]="l.url" target="_blank" rel="noopener noreferrer nofollow ugc">
        <i class="pi" [class.pi-linkedin]="linkedin()" [class.pi-external-link]="!linkedin()" aria-hidden="true"></i>
        <span>Publié à l’origine sur <strong>{{ linkedin() ? 'LinkedIn' : l.site }}</strong><span class="cache">. </span></span>
        <span class="voir">Voir l’original<i class="pi pi-arrow-up-right" aria-hidden="true"></i></span>
        <span class="cache"> (s’ouvre dans un nouvel onglet)</span>
      </a>
    } @else {
      <a class="lien-partage" [href]="l.url" target="_blank" rel="noopener noreferrer nofollow ugc">
        <span class="icone" aria-hidden="true"><i class="pi pi-external-link"></i></span>
        <span class="texte">
          <span class="site">{{ l.site }}<span class="cache"> : </span></span>
          <span class="titre">{{ l.titre || l.url }}<span class="cache">. </span></span>
          @if (description()) { <span class="description">{{ description() }}</span> }
        </span>
        <span class="cache"> (s’ouvre dans un nouvel onglet)</span>
      </a>
    }
  `,
  styles: `
    :host { display: block; margin: .6rem var(--marge, 1rem) 0; }
    a { color: inherit; text-decoration: none; }
    a:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; border-radius: .2rem; }
    .source { display: flex; align-items: center; gap: .45rem; color: var(--ept-text-secondary); font-size: .82rem; }
    .source > .pi { flex: 0 0 auto; font-size: .95rem; }
    .source.linkedin > .pi { color: #0a66c2; }
    strong { font-weight: 600; }
    .voir { display: inline-flex; flex: 0 0 auto; align-items: center; gap: .25rem; color: var(--ept-primary); font-weight: 600; }
    .voir::before { content: '·'; margin-right: .2rem; color: var(--ept-text-secondary); }
    .voir .pi { font-size: .68rem; }
    .source:hover .voir, .lien-partage:hover .titre { text-decoration: underline; }
    .lien-partage { display: flex; align-items: flex-start; gap: .75rem; margin-top: .25rem; padding: .75rem .85rem;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius-sm); background: var(--ept-bg); }
    .lien-partage:hover { border-color: #b7cdd8; }
    .icone { display: grid; flex: 0 0 auto; place-items: center; width: 2.25rem; height: 2.25rem;
      border-radius: var(--ept-radius-sm); background: var(--ept-primary-light); color: var(--ept-primary); }
    .texte { display: grid; gap: .1rem; min-width: 0; }
    .site { color: var(--ept-text-secondary); font-size: .78rem; }
    .titre, .description { display: -webkit-box; overflow: hidden; overflow-wrap: anywhere; -webkit-box-orient: vertical;
      -webkit-line-clamp: 2; line-clamp: 2; }
    .titre { color: var(--ept-primary-dark); font-weight: 600; }
    .description { color: var(--ept-text-secondary); font-size: .88rem; line-height: 1.45; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class LienPublication {
  readonly lien = input.required<Lien>();
  /** Le message reprend le texte de la page liée : le lien devient une simple mention de la source. */
  readonly source = input(false);
  /** Texte de la publication, pour ne pas répéter une description qu’il contient déjà. */
  readonly contenu = input('');

  protected readonly linkedin = computed(() => estLinkedin(this.lien().url, this.lien().site));
  protected readonly description = computed(() => {
    const description = this.lien().description?.trim();
    if (!description) return '';
    const debut = description.slice(0, 80).replace(/\s+/g, ' ');
    return this.contenu().replace(/\s+/g, ' ').includes(debut) ? '' : description;
  });
}
