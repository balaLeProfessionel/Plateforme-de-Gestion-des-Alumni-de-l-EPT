import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { EvenementPublic, TemoignagePublic } from '../models/vitrine.model';

/** Contenu de la page publique, accessible sans compte. */
@Service()
export class ContenuPublicService {
  private readonly http = inject(HttpClient);

  prochainsEvenements() {
    return this.http.get<EvenementPublic[]>('/api/public/evenements');
  }

  temoignages() {
    return this.http.get<TemoignagePublic[]>('/api/public/temoignages');
  }
}
