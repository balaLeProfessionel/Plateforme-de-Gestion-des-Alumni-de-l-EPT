import { Component, input } from '@angular/core';

export interface Conseil {
  titre: string;
  texte: string;
}

/** Encadré de conseils à droite d’un espace de création ; masqué sous 900 px. */
@Component({
  selector: 'app-conseils-creation',
  host: { role: 'complementary', '[attr.aria-labelledby]': '"titre-conseils"' },
  template: `
    <h2 id="titre-conseils"><i class="pi pi-lightbulb" aria-hidden="true"></i> {{ titre() }}</h2>
    <ul>
      @for (c of conseils(); track c.titre) {
        <li><strong>{{ c.titre }}</strong> {{ c.texte }}</li>
      }
    </ul>
  `,
  styles: `
    :host { position: sticky; top: 9rem; display: block; padding: 1.1rem 1.2rem; border: 1px solid #cdebf3;
      border-radius: var(--ept-radius); background: #eef8fb; }
    h2 { display: flex; align-items: center; gap: .5rem; margin: 0 0 .75rem; color: var(--ept-primary-dark);
      font-family: var(--ept-font-heading); font-size: 1rem; font-weight: 600; }
    h2 i { color: var(--ept-primary); }
    ul { display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
    li { color: #2f4b5b; font-size: .88rem; line-height: 1.5; }
    strong { display: block; color: var(--ept-primary-dark); font-weight: 600; }
    @media (max-width: 900px) { :host { display: none; } }
  `,
})
export class ConseilsCreation {
  readonly titre = input.required<string>();
  readonly conseils = input.required<readonly Conseil[]>();
}
