import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';


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
}
