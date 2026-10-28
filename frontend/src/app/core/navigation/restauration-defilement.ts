import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { Router, Scroll } from '@angular/router';
import { filter } from 'rxjs';

const DUREE_MAXIMALE_MS = 3000;
const INTERACTIONS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

/**
 * Complète la restauration du routeur : au retour arrière, Angular ne tente qu’une fois
 * de revenir à la position mémorisée, souvent avant que la page n’ait chargé ses données.
 * On réessaie à chaque image jusqu’à l’atteindre, sans lutter contre un défilement de l’utilisateur.
 */
@Service()
export class RestaurationDefilement {
  private readonly router = inject(Router);
  private readonly fenetre = inject(DOCUMENT).defaultView;
  private arreterEnCours: (() => void) | null = null;

  demarrer(): void {
    this.router.events.pipe(filter((evenement): evenement is Scroll => evenement instanceof Scroll))
      .subscribe(({ position }) => {
        this.arreterEnCours?.();
        if (position) this.restaurer(position[0], position[1]);
      });
  }

  private restaurer(x: number, y: number): void {
    const fenetre = this.fenetre;
    if (!fenetre) return;
    const limite = fenetre.performance.now() + DUREE_MAXIMALE_MS;
    let actif = true;
    const arreter = () => {
      actif = false;
      INTERACTIONS.forEach((type) => fenetre.removeEventListener(type, arreter));
      this.arreterEnCours = null;
    };
    INTERACTIONS.forEach((type) => fenetre.addEventListener(type, arreter, { passive: true }));
    this.arreterEnCours = arreter;

    const essayer = () => {
      if (!actif) return;
      fenetre.scrollTo({ left: x, top: y, behavior: 'instant' });
      if (Math.abs(fenetre.scrollY - y) <= 1 || fenetre.performance.now() > limite) {
        arreter();
        return;
      }
      fenetre.requestAnimationFrame(essayer);
    };
    fenetre.requestAnimationFrame(essayer);
  }
}
