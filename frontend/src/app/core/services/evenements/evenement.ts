import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Evenement, PageEvenements, PeriodeEvenement } from '../models/evenement';

@Service()
export class EvenementService {
  private readonly http = inject(HttpClient);

  lister(periode: PeriodeEvenement, page: number, taille = 12) {
    const params = new HttpParams()
      .set('periode', periode)
      .set('page', page)
      .set('taille', taille);

    return this.http.get<PageEvenements>('/api/evenements', { params });
  }

  obtenir(id: string) {
    return this.http.get<Evenement>(`/api/evenements/${encodeURIComponent(id)}`);
  }
}
