import { Component, effect, ElementRef, input, model, output, viewChild } from '@angular/core';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Message } from 'primeng/message';
import { LIBELLES_THEME, THEMES_ARTICLE, ThemeArticle } from '../../../core/services/articles/article';
import { AudiencePublication } from '../../../core/services/publications/publication';

const AUDIENCES: readonly { valeur: AudiencePublication; libelle: string }[] = [
  { valeur: 'TOUS', libelle: 'Tous les membres' },
  { valeur: 'ALUMNI', libelle: 'Alumni' },
  { valeur: 'ETUDIANTS', libelle: 'Étudiants' },
];

/**
 * Dernière étape avant la mise en ligne : le thème et le public, seuls réglages d’un article.
 * Pour un article déjà publié, la même fenêtre confirme l’enregistrement des modifications.
 */
@Component({
  selector: 'app-dialogue-publication',
  imports: [ButtonDirective, ButtonIcon, Message],
  template: `
    <dialog #dialogue aria-labelledby="titre-dialogue-publication" (close)="annule.emit()">
      <form method="dialog" (submit)="$event.preventDefault(); confirme.emit()">
        <header>
          <h2 id="titre-dialogue-publication">{{ modification() ? 'Enregistrer les modifications' : 'Publier l’article' }}</h2>
          <button pButton type="button" class="fermer" text rounded severity="secondary" aria-label="Fermer" (click)="annule.emit()">
            <i pButtonIcon class="pi pi-times" aria-hidden="true"></i></button>
        </header>

        <fieldset>
          <legend>Thème</legend>
          <div class="pastilles">
            @for (t of themes; track t) {
              <label [class.choisi]="theme() === t">
                <input type="radio" name="theme-article" [value]="t" [checked]="theme() === t" (change)="theme.set(t)" />
                {{ libelles[t] }}
              </label>
            }
          </div>
        </fieldset>

        <fieldset>
          <legend>Qui peut le lire ?</legend>
          <div class="public">
            @for (a of audiences; track a.valeur) {
              <label><input type="radio" name="public-article" [value]="a.valeur" [checked]="audience() === a.valeur"
                (change)="audience.set(a.valeur)" /> {{ a.libelle }}</label>
            }
          </div>
        </fieldset>

        <p class="note">{{ modification()
          ? 'Les modifications seront visibles tout de suite.'
          : 'Il sera visible tout de suite dans le fil et la bibliothèque.' }}</p>
        @if (erreur(); as message) { <p-message class="erreur" severity="error" size="small">{{ message }}</p-message> }

        <footer>
          <button pButton type="button" class="annuler" text severity="secondary" rounded (click)="annule.emit()">Annuler</button>
          <button pButton type="submit" class="confirmer" rounded [disabled]="enCours()" [loading]="enCours()">
            {{ enCours() ? 'Un instant…' : modification() ? 'Enregistrer' : 'Publier maintenant' }}</button>
        </footer>
      </form>
    </dialog>
  `,
  styles: `
    dialog { box-sizing: border-box; width: min(32rem, calc(100vw - 2rem)); padding: 1.5rem; border: 0; border-radius: var(--ept-radius-lg);
      background: var(--ept-surface); color: var(--ept-text, #1d2a33); box-shadow: 0 20px 50px rgb(1 67 101 / 18%); }
    dialog::backdrop { background: rgb(1 30 48 / 35%); backdrop-filter: blur(3px); }
    header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.1rem; }
    h2 { margin: 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.25rem; }
    .fermer { width: 2.5rem; height: 2.5rem; margin: -.5rem -.5rem 0 0; }
    fieldset { min-width: 0; margin: 0 0 1.1rem; padding: 0; border: 0; }
    legend { margin-bottom: .55rem; color: var(--ept-text-secondary); font-size: .85rem; font-weight: 600; }
    .pastilles { display: flex; flex-wrap: wrap; gap: .45rem; }
    .pastilles label { position: relative; display: inline-flex; align-items: center; min-height: 2.25rem; padding: .25rem .9rem;
      border-radius: 999px; background: var(--ept-bg); color: var(--ept-primary-dark); font-size: .9rem; cursor: pointer; }
    .pastilles label.choisi { background: var(--ept-primary); color: #fff; }
    .pastilles input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
    .pastilles label:has(input:focus-visible) { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
    .public { display: flex; flex-wrap: wrap; gap: .5rem 1.4rem; }
    .public label { display: inline-flex; align-items: center; gap: .45rem; min-height: 2rem; font-size: .95rem; cursor: pointer; }
    .public input { width: 1.05rem; height: 1.05rem; margin: 0; accent-color: var(--ept-primary); }
    .note { margin: 0; color: var(--ept-text-secondary); font-size: .85rem; }
    .erreur { display: block; margin-top: .75rem; }
    footer { display: flex; justify-content: flex-end; gap: .5rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--ept-border); }
    footer button { min-height: 2.75rem; padding-inline: 1.1rem; }
    button:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
  `,
})
export class DialoguePublication {
  readonly ouvert = input(false);
  readonly modification = input(false);
  readonly enCours = input(false);
  readonly erreur = input<string | null>(null);
  readonly theme = model.required<ThemeArticle>();
  readonly audience = model.required<AudiencePublication>();
  readonly confirme = output<void>();
  readonly annule = output<void>();

  protected readonly themes = THEMES_ARTICLE;
  protected readonly libelles = LIBELLES_THEME;
  protected readonly audiences = AUDIENCES;
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  constructor() {
    effect(() => {
      const dialogue = this.dialogue().nativeElement;
      if (this.ouvert() && !dialogue.open) dialogue.showModal();
      else if (!this.ouvert() && dialogue.open) dialogue.close();
    });
  }
}
