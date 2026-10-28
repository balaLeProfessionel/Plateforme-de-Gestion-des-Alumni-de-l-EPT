import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export interface EtatNavigationEvenement {
  returnUrl?: unknown;
  originReturnUrl?: unknown;
}

export function urlRetourInterne(valeur: unknown): string | null {
  return typeof valeur === 'string'
    && valeur.startsWith('/')
    && !valeur.startsWith('//')
    && !valeur.startsWith('/\\')
    && !valeur.includes('\\')
    && !/[\u0000-\u001f]/.test(valeur)
    ? valeur
    : null;
}

export function etatNavigationEvenement(): EtatNavigationEvenement {
  const router = inject(Router);
  const document = inject(DOCUMENT);
  return (router.getCurrentNavigation()?.extras.state
    ?? document.defaultView?.history.state
    ?? {}) as EtatNavigationEvenement;
}
