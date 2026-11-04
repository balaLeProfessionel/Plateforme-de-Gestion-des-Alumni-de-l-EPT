import { Component, computed, input, output } from '@angular/core';
import { ApercuLien, apercuLisible, estLinkedin } from '../../../core/services/publications/apercu-lien';

/** Le lien importé, en une ligne : d’où il vient, de quoi il parle, et de quoi le retirer. */
@Component({
  selector: 'app-apercu-lien-importe',
  template: `
    @let a = apercu();
    <div class="ligne">
      <i class="pi" [class.pi-linkedin]="linkedin()" [class.linkedin]="linkedin()" [class.pi-link]="!linkedin()" aria-hidden="true"></i>
      <p class="texte">
        @if (lisible()) { <strong>{{ a.titre || a.site }}</strong> }
        @else { {{ linkedin() ? 'LinkedIn' : a.site }} n’a pas partagé son texte : collez-le dans le message. }
      </p>
      <button type="button" class="retirer" aria-label="Retirer le lien" (click)="retirer.emit()"><i class="pi pi-times" aria-hidden="true"></i></button>
    </div>
    @if (a.image && imageProposee()) {
      <button type="button" class="image" [disabled]="occupe()" (click)="utiliserImage.emit()">
        <i class="pi pi-image" aria-hidden="true"></i> {{ recuperationImage() ? 'Récupération…' : 'Ajouter son image' }}</button>
    }
  `,
  styles: `
    :host { display: block; margin-top: .55rem; }
    .ligne { display: flex; align-items: center; gap: .6rem; }
    .ligne > .pi { flex: 0 0 auto; color: var(--ept-primary); font-size: 1.05rem; }
    .ligne > .pi.linkedin { color: #0a66c2; }
    .texte { flex: 1 1 auto; min-width: 0; margin: 0; color: var(--ept-text-secondary); font-size: .88rem; line-height: 1.4; }
    strong { display: block; overflow: hidden; color: var(--ept-primary-dark); font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
    button { font: inherit; cursor: pointer; }
    button:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .retirer { display: grid; flex: 0 0 auto; place-items: center; width: 2.25rem; height: 2.25rem; border: 0; border-radius: 50%;
      background: transparent; color: var(--ept-text-secondary); }
    .retirer:hover { background: var(--ept-primary-light); color: var(--ept-primary); }
    .image { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.25rem; margin: .35rem 0 0 1.65rem; padding: .3rem .7rem;
      border: 1px solid var(--ept-border); border-radius: 999px; background: var(--ept-surface); color: var(--ept-primary); font-size: .85rem; font-weight: 600; }
    .image:disabled { opacity: .6; cursor: wait; }
  `,
  host: { role: 'status' },
})
export class ApercuLienImporte {
  readonly apercu = input.required<ApercuLien>();
  /** Faux quand une image est déjà jointe à la publication. */
  readonly imageProposee = input(true);
  readonly recuperationImage = input(false);
  readonly occupe = input(false);
  readonly utiliserImage = output<void>();
  readonly retirer = output<void>();

  protected readonly lisible = computed(() => apercuLisible(this.apercu()));
  protected readonly linkedin = computed(() => estLinkedin(this.apercu().url, this.apercu().site));
}
