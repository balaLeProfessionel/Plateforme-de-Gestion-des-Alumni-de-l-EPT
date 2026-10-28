import { Location } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Retour unique de l’application : revient à la page précédente de l’historique
 * (la position de défilement y est restaurée), ou ouvre une page de secours
 * quand on est arrivé directement sur la page (lien partagé, nouvel onglet).
 */
@Service()
export class RetourNavigation {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  /** Vrai si une page de l’application précède la page courante dans l’historique. */
  peutRevenir(): boolean {
    const etat = this.location.getState() as { navigationId?: number } | null;
    return (etat?.navigationId ?? 1) > 1;
  }

  retourner(secours: string): void {
    if (this.peutRevenir()) {
      this.location.back();
    } else {
      void this.router.navigateByUrl(secours);
    }
  }
}
