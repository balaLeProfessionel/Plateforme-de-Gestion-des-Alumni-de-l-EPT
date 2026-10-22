import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  AUCUN_FILTRE,
  AudienceEvenement,
  Evenement,
  EvenementRequest,
  FiltresEvenements,
  PageEvenements,
  PageParticipants,
  PeriodeEvenement,
  ReponseParticipation,
} from '../models/evenement';

@Service()
export class EvenementService {
  private readonly http = inject(HttpClient);

  lister(periode: PeriodeEvenement, page: number, filtres: FiltresEvenements = AUCUN_FILTRE, taille = 12) {
    return this.http.get<PageEvenements>('/api/evenements', { params: parametres(periode, page, filtres, taille) });
  }

  obtenir(id: string) {
    return this.http.get<Evenement>(`/api/evenements/${encodeURIComponent(id)}`);
  }

  listerMesEvenements(periode: PeriodeEvenement, page: number, filtres: FiltresEvenements = AUCUN_FILTRE, taille = 12) {
    return this.http.get<PageEvenements>('/api/evenements/mes-evenements',
      { params: parametres(periode, page, filtres, taille) });
  }

  listerParticipants(id: string, page: number, taille = 12) {
    const params = new HttpParams().set('page', page).set('taille', taille);
    return this.http.get<PageParticipants>(
      `/api/evenements/${encodeURIComponent(id)}/participants`, { params });
  }

  repondre(id: string, reponse: ReponseParticipation) {
    return this.http.put<Evenement>(
      `/api/evenements/${encodeURIComponent(id)}/participation`, { reponse });
  }

  creer(evenement: EvenementRequest) {
    return this.http.post<Evenement>('/api/evenements', evenement);
  }

  modifier(id: string, evenement: EvenementRequest) {
    return this.http.put<Evenement>(`/api/evenements/${encodeURIComponent(id)}`, evenement);
  }

  joindreImage(id: string, image: File) {
    const contenu = new FormData();
    contenu.append('image', image);
    return this.http.post<Evenement>(
      `/api/evenements/${encodeURIComponent(id)}/image`, contenu);
  }

  supprimerImage(id: string) {
    return this.http.delete<Evenement>(`/api/evenements/${encodeURIComponent(id)}/image`);
  }

  annuler(id: string) {
    return this.http.patch<Evenement>(`/api/evenements/${encodeURIComponent(id)}/annuler`, {});
  }

  definirStatutOfficiel(id: string, officielEpt: boolean) {
    return this.http.patch<Evenement>(`/api/evenements/${encodeURIComponent(id)}/officiel`, { officielEpt });
  }
}

/** Seuls les critères renseignés partent dans la requête. */
function parametres(periode: PeriodeEvenement, page: number, filtres: FiltresEvenements, taille: number): HttpParams {
  let params = new HttpParams().set('periode', periode).set('page', page).set('taille', taille);
  if (filtres.recherche.trim()) params = params.set('recherche', filtres.recherche.trim());
  if (filtres.lieu.trim()) params = params.set('lieu', filtres.lieu.trim());
  if (filtres.officiel) params = params.set('officiel', filtres.officiel === 'oui');
  return params;
}
