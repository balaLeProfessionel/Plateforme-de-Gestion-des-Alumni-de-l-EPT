import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Programme, ProgrammeRequest, StatutProgramme } from '../models/mentorat.model';

const API = '/api/mentorat/programmes';

@Service()
export class ProgrammeService {
  private readonly http = inject(HttpClient);

  /** Programmes que je gère : les miens (personnel) ou tous (administration). */
  listerGeres() {
    return this.http.get<Programme[]>(`${API}/geres`);
  }

  /** Programmes ouverts aux rattachements, proposés à tous les membres. */
  listerOuverts() {
    return this.http.get<Programme[]>(`${API}/ouverts`);
  }

  /** Je deviens mentor volontaire du programme (il me faut une offre de mentorat). */
  participer(id: string) {
    return this.http.post<Programme>(`${API}/${encodeURIComponent(id)}/participation`, {});
  }

  seRetirer(id: string) {
    return this.http.delete<Programme>(`${API}/${encodeURIComponent(id)}/participation`);
  }

  obtenir(id: string) {
    return this.http.get<Programme>(`${API}/${encodeURIComponent(id)}`);
  }

  creer(programme: ProgrammeRequest) {
    return this.http.post<Programme>(API, programme);
  }

  modifier(id: string, programme: ProgrammeRequest) {
    return this.http.put<Programme>(`${API}/${encodeURIComponent(id)}`, programme);
  }

  changerStatut(id: string, statut: StatutProgramme) {
    return this.http.patch<Programme>(`${API}/${encodeURIComponent(id)}/statut`, { statut });
  }

  supprimer(id: string) {
    return this.http.delete<void>(`${API}/${encodeURIComponent(id)}`);
  }
}
