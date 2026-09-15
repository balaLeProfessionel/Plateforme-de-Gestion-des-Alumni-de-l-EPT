import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { OrganismeSuggestion } from '../models/organisme.model';


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

  completerMonProfilOrganisme(donnees: CompleterOrganismeRequest) {
    return this.http.patch<void>('/api/organisme/me', donnees);
  }

  // Suggestions pour l'autocomplete des experiences et des formations
  rechercherOrganismes(q: string) {
    return this.http.get<OrganismeSuggestion[]>('/api/organisme/recherche', {
      params: { q }
    });
  }
}
