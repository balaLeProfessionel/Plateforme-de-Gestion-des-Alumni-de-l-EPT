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
