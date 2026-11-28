import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import {
  Convention, CriteresConventions, DatesConvention, DemandeConventionRequete, HistoriqueConvention,
  ModificationConventionRequete, SaisieConventionRequete,
} from '../models/partenariat.model';

const API = '/api/partenariats/conventions';
const API_ADMIN = '/api/admin/partenariats/conventions';

/**
 * Conventions-cadres de partenariat : l’organisme demande et suit les siennes, le service des Relations extérieures
 * les traite toutes. `admin` choisit l’API.
 */
@Service()
export class ConventionsPartenariatService {
  private readonly http = inject(HttpClient);

  // ----- Organisme -----

  mesConventions() {
    return this.http.get<Convention[]>(API);
  }

  demander(demande: DemandeConventionRequete) {
    return this.http.post<Convention>(API, demande);
  }

  modifierDemande(id: string, demande: DemandeConventionRequete) {
    return this.http.put<Convention>(`${API}/${id}`, demande);
  }

  annuler(id: string) {
    return this.http.patch<Convention>(`${API}/${id}/annuler`, {});
  }

  // ----- Service des Relations extérieures -----

  lister(criteres: CriteresConventions, taille = 20, organismeId: string | null = null) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille);
    if (organismeId) params = params.set('organisme', organismeId);
    if (criteres.statut) params = params.set('statut', criteres.statut);
    if (criteres.recherche.trim()) params = params.set('recherche', criteres.recherche.trim());
    if (criteres.expireBientot) params = params.set('expireBientot', true);
    return this.http.get<Page<Convention>>(API_ADMIN, { params });
  }

  saisir(convention: SaisieConventionRequete) {
    return this.http.post<Convention>(API_ADMIN, convention);
  }

  modifier(id: string, convention: ModificationConventionRequete) {
    return this.http.put<Convention>(`${API_ADMIN}/${id}`, convention);
  }

  examiner(id: string) {
    return this.http.patch<Convention>(`${API_ADMIN}/${id}/examiner`, {});
  }

  negocier(id: string) {
    return this.http.patch<Convention>(`${API_ADMIN}/${id}/negocier`, {});
  }

  activer(id: string, dates: DatesConvention) {
    return this.http.patch<Convention>(`${API_ADMIN}/${id}/activer`, dates);
  }

  refuser(id: string, motif: string) {
    return this.http.patch<Convention>(`${API_ADMIN}/${id}/refuser`, { motif });
  }

  // ----- Résiliation, par l’une ou l’autre partie, avec préavis -----

  resilier(id: string, motif: string, admin: boolean) {
    return this.http.patch<Convention>(`${admin ? API_ADMIN : API}/${id}/resilier`, { motif });
  }

  annulerResiliation(id: string, admin: boolean) {
    return this.http.patch<Convention>(`${admin ? API_ADMIN : API}/${id}/annuler-resiliation`, {});
  }

  // ----- Communs -----

  detail(id: string, admin: boolean) {
    return this.http.get<Convention>(`${admin ? API_ADMIN : API}/${id}`);
  }

  historique(id: string, admin: boolean) {
    return this.http.get<HistoriqueConvention[]>(`${admin ? API_ADMIN : API}/${id}/historique`);
  }
}
