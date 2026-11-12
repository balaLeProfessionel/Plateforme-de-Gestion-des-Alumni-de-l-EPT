import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { analyserMarkdown } from './markdown';

/** Corps d’un article, affiché depuis son Markdown limité sans jamais interpréter de HTML. */
@Component({
  selector: 'app-contenu-article',
  imports: [NgTemplateOutlet],
  template: `
    <ng-template #enLigne let-segments>
      @for (s of segments; track $index) {
        @if (s.lien) {
          <a [href]="s.lien" target="_blank" rel="noopener noreferrer nofollow ugc" [class.gras]="s.gras" [class.italique]="s.italique"
            >{{ s.texte }}<span class="cache"> (s’ouvre dans un nouvel onglet)</span></a>
        } @else if (s.gras && s.italique) {
          <strong><em>{{ s.texte }}</em></strong>
        } @else if (s.gras) {
          <strong>{{ s.texte }}</strong>
        } @else if (s.italique) {
          <em>{{ s.texte }}</em>
        } @else {
          <span>{{ s.texte }}</span>
        }
      }
    </ng-template>

    @for (bloc of blocs(); track $index) {
      @switch (bloc.type) {
        @case ('titre2') { <h2><ng-container *ngTemplateOutlet="enLigne; context: { $implicit: bloc.segments }" /></h2> }
        @case ('titre3') { <h3><ng-container *ngTemplateOutlet="enLigne; context: { $implicit: bloc.segments }" /></h3> }
        @case ('citation') { <blockquote><ng-container *ngTemplateOutlet="enLigne; context: { $implicit: bloc.segments }" /></blockquote> }
        @case ('liste') {
          <ul>@for (e of bloc.elements; track $index) { <li><ng-container *ngTemplateOutlet="enLigne; context: { $implicit: e }" /></li> }</ul>
        }
        @case ('liste-numerotee') {
          <ol>@for (e of bloc.elements; track $index) { <li><ng-container *ngTemplateOutlet="enLigne; context: { $implicit: e }" /></li> }</ol>
        }
        @default { <p><ng-container *ngTemplateOutlet="enLigne; context: { $implicit: bloc.segments }" /></p> }
      }
    }
  `,
  styles: `
    :host { display: block; color: #22323d; font-size: 1.05rem; line-height: 1.75; overflow-wrap: anywhere; }
    p, ul, ol, blockquote { margin: 0 0 1.1em; }
    h2, h3 { margin: 1.6em 0 .5em; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); line-height: 1.3; }
    h2 { font-size: 1.3rem; }
    h3 { font-size: 1.1rem; }
    :host > :first-child { margin-top: 0; }
    ul, ol { padding-left: 1.4em; }
    li + li { margin-top: .3em; }
    blockquote { padding: .2em 0 .2em 1em; border-left: 3px solid var(--ept-sky); color: #3d5566; font-style: italic; }
    strong, .gras { font-weight: 650; }
    .italique { font-style: italic; }
    a { color: var(--ept-primary); text-decoration: underline; text-underline-offset: 2px; }
    a:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; border-radius: .15rem; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class ContenuArticle {
  readonly contenu = input.required<string>();
  protected readonly blocs = computed(() => analyserMarkdown(this.contenu()));
}
