import { inject, Service, signal } from '@angular/core';
import { DeclarationsStageService } from './declarations';

/** Stages déclarés en attente de décision : badge de la navigation, actualisé après chaque décision. */
@Service()
export class CompteurDeclarationsATraiter {
  private readonly service = inject(DeclarationsStageService);
  private readonly nombreSignal = signal(0);
  readonly nombre = this.nombreSignal.asReadonly();

  actualiser(): void {
    this.service.nombreATraiter().subscribe({
      next: ({ nombre }) => this.nombreSignal.set(nombre),
      error: () => this.nombreSignal.set(0),
    });
  }
}
