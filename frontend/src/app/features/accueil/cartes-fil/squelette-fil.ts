import { Component } from '@angular/core';

/** Trois publications grises, de la forme du fil plat, le temps que le fil arrive. Purement décoratif. */
@Component({
  selector: 'app-squelette-fil',
  template: `
    @for (n of [1, 2, 3]; track n) {
      <div class="element">
        <div class="entete"><span class="rond"></span>
          <span class="lignes"><span class="barre nom"></span><span class="barre meta"></span></span></div>
        <span class="barre"></span><span class="barre"></span><span class="barre courte"></span>
        @if (n === 1) { <span class="image"></span> }
        <span class="barre actions"></span>
      </div>
    }
  `,
  styles: `
    :host { display: grid; gap: .5rem; }
    .element { display: grid; gap: .6rem; padding: 1.1rem 1.15rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius); background: var(--ept-surface); }
    .entete { display: flex; align-items: center; gap: .75rem; margin-bottom: .3rem; }
    .lignes { display: grid; flex: 1 1 auto; gap: .4rem; }
    .rond, .barre, .image { display: block; border-radius: .4rem; background: #e8eef2; animation: pulse 1.4s ease-in-out infinite; }
    .rond { flex: 0 0 auto; width: 2.75rem; height: 2.75rem; border-radius: 50%; }
    .barre { height: .8rem; }
    .nom { width: 40%; height: .9rem; }
    .meta { width: 25%; height: .65rem; }
    .courte { width: 60%; }
    .image { height: 11rem; margin-top: .3rem; }
    .actions { width: 45%; height: 1.1rem; margin-top: .3rem; }
    @keyframes pulse { 50% { opacity: .55; } }
    @media (prefers-reduced-motion: reduce) { .rond, .barre, .image { animation: none; } }
    @media (max-width: 560px) { .element { padding-inline: 1rem; border: 0; border-radius: 0; } }
  `,
  host: { 'aria-hidden': 'true' },
})
export class SqueletteFil {}
