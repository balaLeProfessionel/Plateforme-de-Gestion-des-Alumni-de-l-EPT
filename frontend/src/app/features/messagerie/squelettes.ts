import { Component, computed, input } from '@angular/core';

// Formes animées qui annoncent le contenu pendant son chargement. Seul le texte « libelle » est lu
// par les lecteurs d'écran ; les formes leur sont masquées. L'animation s'arrête si l'utilisateur
// réduit les mouvements.
const STYLES_COMMUNS = `
  :host { display: block; }
  .forme { background: var(--ept-primary-light); animation: pulsation 1.4s ease-in-out infinite; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @keyframes pulsation { 50% { opacity: 0.5; } }
  @media (prefers-reduced-motion: reduce) { .forme { animation: none; } }
`;

/** Bulles de messages fantômes, alternées à gauche et à droite, pendant le chargement d'un fil. */
@Component({
  selector: 'app-squelette-fil',
  template: `
    <p class="sr-only" role="status">{{ libelle() }}</p>
    <ul aria-hidden="true">
      @for (bulle of bulles; track $index) {
        <li [class.moi]="bulle.moi">
          @if (!bulle.moi) { <span class="forme rond"></span> }
          <span class="forme bulle" [style.width.%]="bulle.largeur" [style.height.rem]="bulle.hauteur"></span>
        </li>
      }
    </ul>
  `,
  styles: [STYLES_COMMUNS, `
    ul { display: grid; gap: 0.75rem; margin: 0; padding: 1rem 0; list-style: none; }
    li { display: flex; align-items: flex-end; gap: 0.5rem; }
    li.moi { justify-content: flex-end; }
    .rond { width: 2rem; height: 2rem; flex: 0 0 auto; border-radius: 50%; }
    .bulle { max-width: 75%; border-radius: 1rem 1rem 1rem 0.25rem; }
    .moi .bulle { border-radius: 1rem 1rem 0.25rem 1rem; }
  `],
})
export class SqueletteFil {
  readonly libelle = input('Chargement des messages…');
  protected readonly bulles = [
    { moi: false, largeur: 55, hauteur: 2.5 },
    { moi: true, largeur: 40, hauteur: 2.25 },
    { moi: false, largeur: 65, hauteur: 3.75 },
    { moi: true, largeur: 50, hauteur: 2.5 },
    { moi: false, largeur: 35, hauteur: 2.25 },
  ];
}

/** Lignes fantômes (avatar + deux traits) pour une liste de membres en cours de chargement. */
@Component({
  selector: 'app-squelette-lignes',
  template: `
    <p class="sr-only" role="status">{{ libelle() }}</p>
    <ul aria-hidden="true">
      @for (i of lignes(); track i) {
        <li><span class="forme rond"></span><span class="traits"><span class="forme"></span><span class="forme"></span></span></li>
      }
    </ul>
  `,
  styles: [STYLES_COMMUNS, `
    ul { display: grid; gap: 0.25rem; margin: 0; padding: 0; list-style: none; }
    li { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; }
    .rond { width: 2.5rem; height: 2.5rem; flex: 0 0 auto; border-radius: 50%; }
    .traits { display: grid; flex: 1; gap: 0.4rem; }
    .traits span { height: 0.7rem; border-radius: 999px; }
    .traits span:last-child { width: 60%; }
  `],
})
export class SqueletteLignes {
  readonly libelle = input('Chargement…');
  readonly nombre = input(3);
  protected readonly lignes = computed(() => Array.from({ length: this.nombre() }, (_, i) => i));
}
