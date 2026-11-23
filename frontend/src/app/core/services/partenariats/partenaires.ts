import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { Page } from '../models/mentorat.model';
import { CriteresPartenaires, Partenaire, PartenariatPublic } from '../models/partenariat.model';

/** Organismes partenaires vus par les membres ; visibilité réglée par les Relations extérieures. */
@Service()
export class PartenairesService {
  private readonly http = inject(HttpClient);

  lister(criteres: CriteresPartenaires, taille = 12) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille);
    if (criteres.recherche.trim()) params = params.set('recherche', criteres.recherche.trim());
    if (criteres.type) params = params.set('type', criteres.type);
    if (criteres.secteur) params = params.set('secteur', criteres.secteur);
    return this.http.get<Page<Partenaire>>('/api/partenaires', { params });
  }

  secteurs() {
    return this.http.get<string[]>('/api/partenaires/secteurs');
  }

  /** Le partenariat de l’organisme, ou null (réponse 204) s’il n’est pas un partenaire visible. */
  partenariat(organismeId: string) {
    return this.http.get<PartenariatPublic | null>(`/api/partenaires/${organismeId}`, { observe: 'response' }).pipe(map((r) => r.body));
  }

  changerVisibilite(organismeId: string, visible: boolean) {
    return this.http.patch<{ visible: boolean }>(`/api/admin/partenariats/organismes/${organismeId}/visibilite`, { visible });
  }
}
