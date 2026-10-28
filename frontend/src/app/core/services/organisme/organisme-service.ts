import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { OrganismePublic, OrganismeSuggestion } from '../models/organisme.model';


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
