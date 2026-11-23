import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { Accord, AccordRequete, CriteresAccords, HistoriqueAccord } from '../models/partenariat.model';

const API = '/api/partenariats/accords';
const API_ADMIN = '/api/admin/partenariats/accords';

/**
 * Accords de stage et de mobilité : l’organisme et le service des Relations extérieures proposent et répondent par
 * les mêmes routes, chacun sous son préfixe (`admin`).
 */
@Service()
export class AccordsService {
  private readonly http = inject(HttpClient);

  mesAccords() {
    return this.http.get<Accord[]>(API);
  }

  lister(criteres: CriteresAccords, taille = 20) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille);
    if (criteres.type) params = params.set('type', criteres.type);
    if (criteres.statut) params = params.set('statut', criteres.statut);
    if (criteres.recherche.trim()) params = params.set('recherche', criteres.recherche.trim());
    if (criteres.aRepondre) params = params.set('aRepondre', true);
    return this.http.get<Page<Accord>>(API_ADMIN, { params });
  }

  proposer(accord: AccordRequete, admin: boolean) {
    return this.http.post<Accord>(admin ? API_ADMIN : API, accord);
  }

  modifier(id: string, accord: AccordRequete, admin: boolean) {
    return this.http.put<Accord>(`${admin ? API_ADMIN : API}/${id}`, accord);
  }

  detail(id: string, admin: boolean) {
    return this.http.get<Accord>(`${admin ? API_ADMIN : API}/${id}`);
  }

  historique(id: string, admin: boolean) {
    return this.http.get<HistoriqueAccord[]>(`${admin ? API_ADMIN : API}/${id}/historique`);
  }

  retirer(id: string, admin: boolean) {
    return this.http.patch<Accord>(`${admin ? API_ADMIN : API}/${id}/retirer`, {});
  }

  accepter(id: string, admin: boolean) {
    return this.http.patch<Accord>(`${admin ? API_ADMIN : API}/${id}/accepter`, {});
  }

  refuser(id: string, motif: string, admin: boolean) {
    return this.http.patch<Accord>(`${admin ? API_ADMIN : API}/${id}/refuser`, { motif });
  }

  /** Résiliation avec préavis : l’accord reste en vigueur jusqu’à la date d’effet. */
  resilier(id: string, motif: string, admin: boolean) {
    return this.http.patch<Accord>(`${admin ? API_ADMIN : API}/${id}/resilier`, { motif });
  }

  annulerResiliation(id: string, admin: boolean) {
    return this.http.patch<Accord>(`${admin ? API_ADMIN : API}/${id}/annuler-resiliation`, {});
  }
}
