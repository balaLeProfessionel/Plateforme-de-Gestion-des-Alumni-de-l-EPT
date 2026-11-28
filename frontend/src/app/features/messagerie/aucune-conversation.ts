import { Component } from '@angular/core';

/** Colonne de droite tant qu’aucune conversation n’est ouverte (masquée sur petit écran). */
@Component({
  selector: 'app-aucune-conversation',
  template: `
    <i class="pi pi-comments" aria-hidden="true"></i>
    <h2>Vos messages</h2>
    <p>Choisissez une conversation dans la liste, ou démarrez-en une avec « Nouvelle conversation ».</p>
  `,
  styles: `
    :host {
      display: grid;
      flex: 1;
      place-content: center;
      justify-items: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--ept-text-secondary);
      text-align: center;
    }
    i {
      display: grid;
      width: 4rem;
      height: 4rem;
      place-items: center;
      border-radius: 50%;
      background: var(--ept-primary-light);
      color: var(--ept-primary);
      font-size: 1.6rem;
    }
    h2 { margin: 0.5rem 0 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.2rem; }
    p { max-width: 22rem; margin: 0; line-height: 1.5; }
  `,
})
export class AucuneConversation {}
