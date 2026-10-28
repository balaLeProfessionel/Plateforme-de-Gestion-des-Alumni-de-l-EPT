import { computed, inject, Service, signal } from '@angular/core';
import { MentoratService } from './mentorat';

/**
 * Compteurs du mentorat partagés par la navigation et les écrans : demandes reçues en attente (badge),
 * et demandes envoyées sans réponse, pour prévenir avant d’atteindre la limite du serveur.
 */
@Service()
export class CompteurDemandesMentorat {
  private readonly mentoratService = inject(MentoratService);
  private readonly nombreSignal = signal(0);
  private readonly envoyeesSignal = signal(0);
  private readonly maximumSignal = signal(Number.POSITIVE_INFINITY);
  readonly nombre = this.nombreSignal.asReadonly();
  readonly envoyees = this.envoyeesSignal.asReadonly();
  readonly maximum = this.maximumSignal.asReadonly();
  /** Faux tant que les compteurs ne sont pas chargés : le serveur reste le garde-fou. */
  readonly limiteAtteinte = computed(() => this.envoyees() >= this.maximum());

  actualiser(): void {
    this.mentoratService.compter().subscribe({
      next: ({ demandesRecuesEnAttente, demandesEnvoyeesEnAttente, demandesEnAttenteMax }) => {
        this.nombreSignal.set(demandesRecuesEnAttente);
        this.envoyeesSignal.set(demandesEnvoyeesEnAttente);
        this.maximumSignal.set(demandesEnAttenteMax);
      },
      error: () => {
        this.nombreSignal.set(0);
        this.envoyeesSignal.set(0);
        this.maximumSignal.set(Number.POSITIVE_INFINITY);
      },
    });
  }
}
