import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { FileModerationOffres, OffreAModerer } from '../models/offre-emploi.model';

const API = '/api/admin/offres-emploi';

/** Modération des offres d’emploi par l’administration (#224, permission GERER_OFFRES_EMPLOI). */
@Service()
export class ModerationOffresEmploiService {
  private readonly http = inject(HttpClient);

  lister(file: FileModerationOffres, page: number, taille = 20) {
    const params = new HttpParams().set('file', file).set('page', page).set('taille', taille);
    return this.http.get<Page<OffreAModerer>>(API, { params });
  }

  compteur() {
    return this.http.get<{ aVerifier: number; signalees: number }>(`${API}/compteur`);
  }

  publier(id: string) {
    return this.http.patch<OffreAModerer>(`${API}/${encodeURIComponent(id)}/publier`, {});
  }

  refuser(id: string, motif: string) {
    return this.http.patch<OffreAModerer>(`${API}/${encodeURIComponent(id)}/refuser`, { motif });
  }

  retirer(id: string, motif: string) {
    return this.http.patch<OffreAModerer>(`${API}/${encodeURIComponent(id)}/retirer`, { motif });
  }

  classerSignalements(id: string) {
    return this.http.patch<OffreAModerer>(`${API}/${encodeURIComponent(id)}/classer-signalements`, {});
  }
}

/** Offres d’emploi à modérer (à vérifier et signalées) : badge de la navigation, actualisé après chaque décision. */
@Service()
export class CompteurOffresEmploiAModerer {
  private readonly service = inject(ModerationOffresEmploiService);
  private readonly nombreSignal = signal(0);
  readonly nombre = this.nombreSignal.asReadonly();

  actualiser(): void {
    this.service.compteur().subscribe({
      next: ({ aVerifier, signalees }) => this.nombreSignal.set(aVerifier + signalees),
      error: () => this.nombreSignal.set(0),
    });
  }
}
