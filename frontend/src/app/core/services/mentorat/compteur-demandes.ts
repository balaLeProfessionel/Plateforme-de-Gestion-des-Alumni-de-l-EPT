import { inject, Service, signal } from '@angular/core';
import { MentoratService } from './mentorat';

/** Nombre de demandes reçues en attente, partagé par la barre latérale et les onglets du mentorat. */
@Service()
export class CompteurDemandesMentorat {
  private readonly mentoratService = inject(MentoratService);
  private readonly nombreSignal = signal(0);
  readonly nombre = this.nombreSignal.asReadonly();

  actualiser(): void {
    this.mentoratService.compter().subscribe({
      next: ({ demandesRecuesEnAttente }) => this.nombreSignal.set(demandesRecuesEnAttente),
      error: () => this.nombreSignal.set(0),
    });
  }
}
