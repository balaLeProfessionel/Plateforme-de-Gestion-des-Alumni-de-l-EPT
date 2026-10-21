import { afterNextRender, Injector } from '@angular/core';

/**
 * Après une soumission refusée, place le focus sur le premier champ en erreur une fois
 * les messages affichés : le clavier et les lecteurs d'écran arrivent directement sur la correction.
 */
export function focaliserPremiereErreur(conteneur: HTMLElement, injector: Injector): void {
  afterNextRender(() => {
    conteneur.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, { injector });
}
