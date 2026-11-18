import { afterNextRender, Component, ElementRef, input, output, viewChild } from '@angular/core';

/**
 * Visionneuse plein écran d’une photo reçue ou envoyée, comme dans les messageries : fond sombre, l’image
 * entière au centre, son nom, « Télécharger » et « Fermer » en haut. Échap, la croix ou un clic à côté de
 * l’image la ferment ; le focus part sur « Fermer ».
 */
@Component({
  selector: 'app-visionneuse-image',
  template: `
    <dialog #dialogue class="visionneuse" [attr.aria-label]="'Image : ' + nom()" (close)="fermee.emit()"
      (click)="clic($event)">
      <div class="barre">
        <span class="nom">{{ nom() }}</span>
        <a class="action" [href]="url()" [attr.download]="nom()" aria-label="Télécharger l’image" title="Télécharger">
          <i class="pi pi-download" aria-hidden="true"></i>
        </a>
        <button type="button" class="action fermer" aria-label="Fermer" title="Fermer" (click)="dialogue.close()">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </div>
      <div class="scene">
        <img [src]="url()" [alt]="'Image jointe : ' + nom()" />
      </div>
    </dialog>
  `,
  styles: `
    .visionneuse {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      padding: 0;
      border: 0;
      background: transparent;
      color: #fff;

      &::backdrop { background: rgba(0, 12, 20, 0.92); }
      &[open] { display: flex; flex-direction: column; }
    }

    .barre { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; }

    .nom { min-width: 0; flex: 1; overflow: hidden; font-size: 0.95rem; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }

    .action {
      display: grid;
      width: 2.75rem;
      height: 2.75rem;
      flex: 0 0 auto;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      font-size: 1.05rem;
      cursor: pointer;

      &:hover { background: rgba(255, 255, 255, 0.24); }
      &:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
    }

    /* Un clic sur cette zone, à côté de l’image, ferme la visionneuse. */
    .scene { display: grid; min-height: 0; flex: 1; place-items: center; padding: 0 1rem 1.5rem; cursor: zoom-out; }

    img {
      max-width: 100%;
      max-height: 100%;
      border-radius: 0.5rem;
      box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
      object-fit: contain;
      cursor: default;
      animation: apparition 0.18s ease-out;
    }

    @keyframes apparition { from { opacity: 0; transform: scale(0.97); } }
    @media (prefers-reduced-motion: reduce) { img { animation: none; } }
  `,
})
export class VisionneuseImage {
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  readonly url = input.required<string>();
  readonly nom = input.required<string>();
  readonly fermee = output<void>();

  constructor() {
    afterNextRender(() => {
      const dialogue = this.dialogue().nativeElement;
      dialogue.showModal();
      dialogue.querySelector<HTMLElement>('.fermer')?.focus();
    });
  }

  /** Le clic ne remonte pas jusqu’à la bulle ; à côté de l’image (fond ou zone vide), il ferme. */
  protected clic(evenement: MouseEvent): void {
    evenement.stopPropagation();
    const cible = evenement.target as HTMLElement;
    if (cible === this.dialogue().nativeElement || cible.classList.contains('scene')) this.dialogue().nativeElement.close();
  }
}
