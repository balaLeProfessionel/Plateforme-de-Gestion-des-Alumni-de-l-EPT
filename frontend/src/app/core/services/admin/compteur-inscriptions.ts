import { computed, inject, Service, signal } from '@angular/core';
import { ResumeComptes } from '../models/admin.model';
import { AdminComptesService } from './admin-comptes';

/** Nombre de comptes par statut, partagé par la navigation (badge) et les pages d’administration. */
@Service()
export class CompteurInscriptions {
  private readonly service = inject(AdminComptesService);
  private readonly resumeSignal = signal<ResumeComptes | null>(null);
  readonly resume = this.resumeSignal.asReadonly();
  readonly nombre = computed(() => this.resume()?.enAttente ?? 0);

  actualiser(): void {
    this.service.resume().subscribe({
      next: (resume) => this.resumeSignal.set(resume),
      error: () => this.resumeSignal.set(null),
    });
  }
}
