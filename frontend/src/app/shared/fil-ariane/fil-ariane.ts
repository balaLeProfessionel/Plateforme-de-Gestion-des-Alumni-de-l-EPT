import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface EtapeFilAriane {
  libelle: string;
  lien?: string;
}

/** Fil d’Ariane des pages de l’espace membre ; la dernière étape est la page courante. */
@Component({
  selector: 'app-fil-ariane',
  imports: [RouterLink],
  template: `
    <nav aria-label="Fil d’Ariane">
      <ol>
        @for (etape of etapes(); track etape.libelle; let derniere = $last) {
          <li [attr.aria-current]="derniere ? 'page' : null">
            @if (etape.lien && !derniere) {
              <a [routerLink]="etape.lien">{{ etape.libelle }}</a>
            } @else {
              {{ etape.libelle }}
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host { display: block; margin-bottom: 0.75rem; }
    ol { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0; padding: 0; list-style: none; font-size: 0.85rem; }
    li { color: var(--ept-primary-dark); font-weight: 600; }
    li + li::before { content: '/'; margin-right: 0.5rem; color: var(--ept-text-secondary); font-weight: 400; }
    a { color: var(--ept-text-secondary); font-weight: 400; text-decoration: none; }
    a:hover { color: var(--ept-primary); text-decoration: underline; }
    a:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
  `,
})
export class FilAriane {
  readonly etapes = input.required<EtapeFilAriane[]>();
}
