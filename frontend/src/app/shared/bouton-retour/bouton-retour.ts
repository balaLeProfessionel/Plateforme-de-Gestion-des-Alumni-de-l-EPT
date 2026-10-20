import { Component, inject, input } from '@angular/core';
import { RetourNavigation } from '../../core/navigation/retour-navigation';

/** Bouton « Retour » commun : revient à la page précédente et à sa position, sinon à `secours`. */
@Component({
  selector: 'app-bouton-retour',
  template: `
    <button type="button" (click)="retourner()">
      <i class="pi pi-arrow-left" aria-hidden="true"></i>{{ libelle() }}
    </button>
  `,
  styles: `
    :host { display: block; margin-bottom: 1rem; }
    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 2.5rem;
      margin-left: -0.6rem;
      padding: 0.45rem 0.75rem;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--ept-primary);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: var(--ept-primary-light); }
    button:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
    i { font-size: 0.85rem; }
  `,
})
export class BoutonRetour {
  private readonly retour = inject(RetourNavigation);
  /** Page ouverte quand il n’y a pas de page précédente ; une fonction n’est évaluée qu’au clic. */
  readonly secours = input.required<string | (() => string)>();
  readonly libelle = input('Retour');

  protected retourner(): void {
    const secours = this.secours();
    this.retour.retourner(typeof secours === 'function' ? secours() : secours);
  }
}
