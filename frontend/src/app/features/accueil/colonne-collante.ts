import { afterNextRender, DestroyRef, Directive, DOCUMENT, ElementRef, inject, input, signal } from '@angular/core';

/**
 * Colonne latérale qui reste visible au défilement, sans barre de défilement à elle.
 * Si elle tient dans l’écran, elle se colle sous la barre du haut ; sinon elle défile avec la page
 * jusqu’à ce que son bas apparaisse, puis se colle par le bas.
 */
@Directive({
  selector: '[appColonneCollante]',
  host: { '[style.position]': '"sticky"', '[style.top.px]': 'haut()' },
})
export class ColonneCollante {
  /** Espace laissé sous la barre du haut et au bas de l’écran, en pixels. */
  readonly margeHaut = input(88);
  readonly margeBas = input(16);

  protected readonly haut = signal(88);

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const fenetre = inject(DOCUMENT).defaultView;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (!fenetre) return;
      const calculer = () => this.haut.set(
        Math.min(this.margeHaut(), fenetre.innerHeight - element.offsetHeight - this.margeBas()));
      const observateur = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(calculer);
      observateur?.observe(element);
      fenetre.addEventListener('resize', calculer);
      calculer();
      destroyRef.onDestroy(() => { observateur?.disconnect(); fenetre.removeEventListener('resize', calculer); });
    });
  }
}
