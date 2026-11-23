import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { Declaration, DeclarationRequete, StatutStage } from '../models/stage.model';

const API = '/api/stages/declarations';
const API_ADMIN = '/api/admin/stages/declarations';

/** Stages trouvés par les étudiants hors offre (STA-10) : déclaration, puis décision de l’administrateur Stages. */
@Service()
export class DeclarationsStageService {
  private readonly http = inject(HttpClient);

  declarer(requete: DeclarationRequete) {
    return this.http.post<Declaration>(API, requete);
  }

  retirer(id: string) {
    return this.http.patch<void>(`${API}/${id}/retirer`, {});
  }

  lister(statut: Extract<StatutStage, 'DECLARE' | 'CONFIRME' | 'REFUSE'>, page: number, taille = 20) {
    const params = new HttpParams().set('statut', statut).set('page', page).set('taille', taille);
    return this.http.get<Page<Declaration>>(API_ADMIN, { params });
  }

  nombreATraiter() {
    return this.http.get<{ nombre: number }>(`${API_ADMIN}/a-traiter`);
  }

  /** Organisme connu (organismeId) ou à créer (nomNouvelOrganisme) ; sans les deux, celui de la déclaration. */
  valider(id: string, organisme: { organismeId?: string; nomNouvelOrganisme?: string } = {}) {
    return this.http.patch<Declaration>(`${API_ADMIN}/${id}/valider`, organisme);
  }

  refuser(id: string, motif: string) {
    return this.http.patch<Declaration>(`${API_ADMIN}/${id}/refuser`, { motif });
  }
}
