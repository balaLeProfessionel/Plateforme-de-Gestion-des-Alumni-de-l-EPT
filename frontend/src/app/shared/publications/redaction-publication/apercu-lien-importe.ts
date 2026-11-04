import { Component, computed, input, output } from '@angular/core';
import { ApercuLien, apercuLisible } from '../../../core/services/publications/apercu-lien';

/** Ce qui a été lu du lien importé, et ce que le membre peut en faire, dans le formulaire de rédaction. */
@Component({
  selector: 'app-apercu-lien-importe',
  template: `
    @let a = apercu();
    <span class="icone" aria-hidden="true"><i class="pi" [class.pi-linkedin]="linkedin()" [class.pi-link]="!linkedin()"></i></span>
    <div class="texte">
      <p class="site">{{ a.site }}</p>
      @if (lisible()) {
        <p class="titre">{{ a.titre || a.url }}</p>
        @if (texteImporte()) { <p class="note">Texte repris dans votre message : relisez-le avant de publier.</p> }
      } @else {
        <p class="note">Ce site ne laisse pas lire sa publication automatiquement, c’est souvent le cas de LinkedIn.
          Le lien sera joint : copiez le texte de votre publication dans le message ci-dessous.</p>
      }
    </div>
    <div class="actions">
      @if (a.image && imageProposee()) {
        <button type="button" [disabled]="occupe()" (click)="utiliserImage.emit()">
          {{ recuperationImage() ? 'Récupération…' : 'Utiliser l’image du lien' }}</button>
      }
      <button type="button" (click)="retirer.emit()">Retirer le lien</button>
    </div>
  `,
  styles: `
    :host { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .3rem .75rem; margin-top: .75rem; padding: .75rem;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius); background: var(--ept-bg); }
    p { margin: 0; }
    .icone { display: grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: var(--ept-radius-sm);
      background: var(--ept-primary-light); color: var(--ept-primary); font-size: 1.1rem; }
    .site { color: var(--ept-text-secondary); font-size: .8rem; }
    .titre { margin-top: .1rem; color: var(--ept-primary-dark); font-weight: 600; overflow-wrap: anywhere;
      display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
    .note { margin-top: .3rem; color: var(--ept-text-secondary); font-size: .88rem; line-height: 1.45; }
    .actions { grid-column: 2; display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .4rem; }
    button { min-height: 2.5rem; padding: .45rem .8rem; border: 1px solid var(--ept-border); border-radius: var(--ept-radius-sm);
      background: var(--ept-surface); color: var(--ept-primary); font: inherit; font-weight: 600; cursor: pointer; }
    button:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    button:disabled { opacity: .6; cursor: wait; }
    @media (max-width: 560px) { .actions { grid-column: 1 / -1; } }
  `,
  host: { role: 'status' },
})
export class ApercuLienImporte {
  readonly apercu = input.required<ApercuLien>();
  readonly texteImporte = input(false);
  /** Faux quand une image est déjà jointe à la publication. */
  readonly imageProposee = input(true);
  readonly recuperationImage = input(false);
  readonly occupe = input(false);
  readonly utiliserImage = output<void>();
  readonly retirer = output<void>();

  protected readonly lisible = computed(() => apercuLisible(this.apercu()));
  protected readonly linkedin = computed(() => /linkedin\.com\//i.test(this.apercu().url));
}
