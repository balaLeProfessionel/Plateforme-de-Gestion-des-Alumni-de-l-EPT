import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { OrganismePublic, OrganismeSuggestion, PageMembresOrganisme, PresenceMembre } from '../models/organisme.model';


export interface CompleterOrganismeRequest {
  description: string;
  secteurActivite: string;
  typeOrganisme: string;
  adresse?: string;
  siteWeb?: string;
  logoUrl?: string;
  statutJuridique?: string;
  pays?: string;
}
@Service()
export class OrganismeService {
  private readonly http = inject(HttpClient);

  obtenirProfilPublic(id: string) {
    return this.http.get<OrganismePublic>(`/api/organisme/${encodeURIComponent(id)}`);
  }

  /** « Ils travaillent ou ont travaillé ici » : seuls les profils visibles dans l'annuaire. */
  listerMembres(id: string, page: number, taille = 12, presence: PresenceMembre | null = null, recherche = '') {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (presence) params = params.set('presence', presence);
    if (recherche.trim()) params = params.set('recherche', recherche.trim());
    return this.http.get<PageMembresOrganisme>(`/api/organisme/${encodeURIComponent(id)}/membres`, { params });
  }

  obtenirMonProfil() {
    return this.http.get<OrganismePublic>('/api/organisme/me');
  }

  completerMonProfilOrganisme(donnees: CompleterOrganismeRequest) {
    return this.http.patch<OrganismePublic>('/api/organisme/me', donnees);
  }

  // Suggestions pour l'autocomplete des experiences et des formations
  rechercherOrganismes(q: string) {
    return this.http.get<OrganismeSuggestion[]>('/api/organisme/recherche', {
      params: { q }
    });
  }
}
