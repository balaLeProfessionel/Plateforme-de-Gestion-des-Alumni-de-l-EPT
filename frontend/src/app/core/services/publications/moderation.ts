import { HttpClient, HttpParams } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { MotifSignalement, TypePublication } from './publication';

export type StatutSignalement = 'EN_ATTENTE' | 'PUBLICATION_MASQUEE' | 'REJETE';

export interface Signalement {
  id: string;
  motif: MotifSignalement;
  detail: string | null;
  statut: StatutSignalement;
  creeLe: string;
  traiteLe: string | null;
  signaleParPrenom: string | null;
  signaleParNom: string | null;
  traiteParPrenom: string | null;
  traiteParNom: string | null;
  publication: {
    id: string;
    type: TypePublication;
    titre: string | null;
    contenu: string;
    urlImage: string | null;
    statut: 'PUBLIE' | 'MASQUE' | 'SUPPRIME';
    publieLe: string;
    auteurId: string;
    auteurPrenom: string | null;
    auteurNom: string | null;
  };
}

export interface PageSignalements {
  contenu: Signalement[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

/** File de modération de l’administration (permission MODERER_PUBLICATIONS). */
@Service()
export class ModerationService {
  private readonly http = inject(HttpClient);
  lister(traites: boolean, page = 0, taille = 20) {
    return this.http.get<PageSignalements>('/api/admin/signalements', {
      params: new HttpParams().set('traites', traites).set('page', page).set('taille', taille),
    });
  }
  compteur() {
    return this.http.get<{ enAttente: number }>('/api/admin/signalements/compteur');
  }
  masquerPublication(id: string) {
    return this.http.patch<Signalement>(`/api/admin/signalements/${id}/masquer`, {});
  }
  rejeter(id: string) {
    return this.http.patch<Signalement>(`/api/admin/signalements/${id}/rejeter`, {});
  }
}

/** Signalements en attente, partagés par la navigation (badge) et la page de modération. */
@Service()
export class CompteurSignalements {
  private readonly service = inject(ModerationService);
  private readonly nombreSignal = signal<number | null>(null);
  readonly nombre = computed(() => this.nombreSignal() ?? 0);

  actualiser(): void {
    this.service.compteur().subscribe({
      next: ({ enAttente }) => this.nombreSignal.set(enAttente),
      error: () => this.nombreSignal.set(null),
    });
  }
}
