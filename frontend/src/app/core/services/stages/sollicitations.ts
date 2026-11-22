import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { DestinataireSollicitation, Sollicitation, TypeSollicitation } from '../models/stage.model';

const API = '/api/admin/stages/sollicitations';

/** Sollicitation des organismes par l’administrateur Stages (STA-11). */
@Service()
export class SollicitationsService {
  private readonly http = inject(HttpClient);

  destinataires() {
    return this.http.get<DestinataireSollicitation[]>(`${API}/destinataires`);
  }

  modele(type: TypeSollicitation) {
    return this.http.get<{ objet: string; message: string }>(`${API}/modele`, { params: new HttpParams().set('type', type) });
  }

  envoyer(envoi: { type: TypeSollicitation; objet: string; message: string; organismeIds: string[] }) {
    return this.http.post<Sollicitation>(API, envoi);
  }

  historique(page: number, taille = 10) {
    return this.http.get<Page<Sollicitation>>(API, { params: new HttpParams().set('page', page).set('taille', taille) });
  }

  detail(id: string) {
    return this.http.get<Sollicitation>(`${API}/${id}`);
  }
}
