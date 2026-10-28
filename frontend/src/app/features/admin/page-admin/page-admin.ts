import { Component, computed, input } from '@angular/core';
import { EtapeFilAriane, FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/** Gabarit commun des pages d’administration : fil d’Ariane, titre, actions, introduction. */
@Component({
  selector: 'app-page-admin',
  imports: [FilAriane],
  template: `
    <app-fil-ariane [etapes]="etapes()" />
    <header class="entete">
      <div class="titre">
        <h1>{{ titre() }}</h1>
        <ng-content select="[actionsPage]" />
      </div>
      @if (introduction()) { <p class="introduction">{{ introduction() }}</p> }
    </header>
    <ng-content />
  `,
  styles: `
    :host { display: block; width: min(100% - 3rem, 1100px); margin: 0 auto; padding: 1.5rem 0 clamp(2.5rem, 6vw, 4rem); }
    .entete { margin-bottom: 1.25rem; }
    .titre { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 1rem; }
    h1 { margin: 0; color: var(--ept-primary-dark); font-size: clamp(1.5rem, 3vw, 1.9rem); line-height: 1.15; overflow-wrap: anywhere; }
    .introduction { max-width: 50rem; margin: 0.4rem 0 0; color: var(--ept-text-secondary); font-size: 0.95rem; line-height: 1.5; }
    @media (max-width: 560px) { :host { width: min(100% - 2rem, 1100px); } }
  `,
})
export class PageAdmin {
  readonly titre = input.required<string>();
  readonly introduction = input('');
  /** Pages intermédiaires entre l’administration et la page courante (ex. Comptes pour une fiche). */
  readonly parents = input<readonly EtapeFilAriane[]>([]);
  /** Le tableau de bord est la racine : son fil d’Ariane ne répète pas « Administration ». */
  readonly racine = input(false);

  protected readonly etapes = computed<EtapeFilAriane[]>(() => this.racine()
    ? [{ libelle: 'Administration' }, { libelle: this.titre() }]
    : [{ libelle: 'Administration', lien: '/admin' }, ...this.parents(), { libelle: this.titre() }]);
}
