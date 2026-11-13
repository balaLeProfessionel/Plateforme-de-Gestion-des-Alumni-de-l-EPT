import { Component, input, output } from '@angular/core';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';

/**
 * Barre du haut commune aux espaces de création (publication, article, événement) :
 * « × · titre · état … action principale ». Elle reste visible sous l’en-tête pendant le défilement.
 *
 * Avec `formulaire`, le bouton principal soumet ce formulaire (attribut HTML `form`) ;
 * sans, il émet `valider`.
 */
@Component({
  selector: 'app-barre-creation',
  imports: [ButtonDirective, ButtonIcon, ButtonLabel],
  template: `
    <div class="barre">
      <button pButton type="button" class="fermer" text rounded severity="secondary" [attr.aria-label]="libelleFermer()"
        [disabled]="enCours()" (click)="fermer.emit()"><i pButtonIcon class="pi pi-times" aria-hidden="true"></i></button>
      <div class="titres">
        <h1>{{ titre() }}</h1>
        @if (etat()) { <p class="etat" [class.erreur]="etatErreur()" role="status">{{ etat() }}</p> }
      </div>
      <button pButton class="action" rounded [type]="formulaire() ? 'submit' : 'button'" [attr.form]="formulaire()"
        [disabled]="enCours() || desactivee()" (click)="formulaire() || valider.emit()">
        <span pButtonLabel>{{ enCours() ? libelleEnCours() : libelleAction() }}</span></button>
    </div>
  `,
  styles: `
    :host { position: sticky; top: 3.5rem; z-index: 6; display: block; border-bottom: 1px solid var(--ept-border);
      background: var(--ept-surface); }
    .barre { box-sizing: border-box; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center;
      gap: .75rem; max-width: 64rem; margin: 0 auto; padding: .55rem 2rem .55rem 1.6rem; }
    .fermer { width: 2.75rem; height: 2.75rem; }
    .titres { display: grid; gap: .05rem; min-width: 0; }
    h1 { margin: 0; overflow: hidden; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.1rem;
      font-weight: 600; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
    .etat { margin: 0; overflow: hidden; color: var(--ept-text-secondary); font-size: .82rem; text-overflow: ellipsis; white-space: nowrap; }
    .etat.erreur { color: var(--ept-error-dark); }
    .action { min-height: 2.5rem; padding-inline: 1.25rem; }
    @media (max-width: 760px) {
      :host { top: 4rem; }
      .barre { gap: .5rem; padding: .45rem .75rem .45rem .5rem; }
      h1 { font-size: 1rem; }
      .action { padding-inline: 1rem; }
    }
  `,
})
export class BarreCreation {
  readonly titre = input.required<string>();
  /** Ligne d’état sous le titre : « Brouillon enregistré », « Visible par tous les membres »… */
  readonly etat = input('');
  readonly etatErreur = input(false);
  readonly libelleFermer = input('Fermer');
  readonly libelleAction = input('Publier');
  readonly libelleEnCours = input('Publication…');
  readonly enCours = input(false);
  readonly desactivee = input(false);
  /** Identifiant du formulaire que le bouton principal soumet. */
  readonly formulaire = input<string | null>(null);

  readonly fermer = output<void>();
  readonly valider = output<void>();
}
