import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { HistoriqueConvention as LigneHistorique, LIBELLES_ACTION_CONVENTION } from '../../../core/services/models/partenariat.model';

/** Historique d’une convention, du plus ancien au plus récent : quoi, qui, quand, pourquoi. */
@Component({
  selector: 'app-historique-convention',
  imports: [DatePipe],
  template: `
    <section aria-labelledby="titre-historique-convention">
      <h2 id="titre-historique-convention">Historique</h2>
      @if (lignes().length === 0) {
        <p class="vide">Aucune opération enregistrée.</p>
      } @else {
        <ol>
          @for (h of lignes(); track $index) {
            <li>
              <time [attr.datetime]="h.date">{{ h.date | date: 'd MMM y, HH:mm' }}</time>
              <span><strong>{{ actions[h.action] }}</strong>@if (h.details) { — {{ h.details }} }, par {{ h.auteur }}
                @if (h.motif) { <span class="motif">Motif : {{ h.motif }}</span> }</span>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: `
    @use 'responsive' as *;
    section { display: grid; gap: 0.75rem; }
    h2 { margin: 0; color: var(--ept-primary-dark); font-size: 1.05rem; }
    ol { display: grid; gap: 0.55rem; margin: 0; padding: 0; list-style: none; }
    li { display: grid; gap: 0.15rem; padding-left: 0.75rem; border-left: 2px solid var(--ept-border); color: var(--ept-primary-dark); font-size: 0.88rem;
      @include a-partir-de(tablette) { grid-template-columns: 10rem minmax(0, 1fr); } }
    time { color: var(--ept-text-secondary); font-size: 0.82rem; }
    .motif { display: block; color: var(--ept-text-secondary); }
    .vide { margin: 0; color: var(--ept-text-secondary); }
  `,
})
export class HistoriqueConventionListe {
  readonly lignes = input.required<readonly LigneHistorique[]>();
  protected readonly actions = LIBELLES_ACTION_CONVENTION;
}
