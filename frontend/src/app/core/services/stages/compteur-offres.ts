import { inject, Service, signal } from '@angular/core';
import { OffresStageService } from './offres-stage';

/** Offres de stage en attente de vérification : badge de la navigation, actualisé après chaque décision. */
@Service()
export class CompteurOffresAVerifier {
  private readonly service = inject(OffresStageService);
  private readonly nombreSignal = signal(0);
  readonly nombre = this.nombreSignal.asReadonly();

  actualiser(): void {
    this.service.nombreAVerifier().subscribe({
      next: ({ nombre }) => this.nombreSignal.set(nombre),
      error: () => this.nombreSignal.set(0),
    });
  }
}
