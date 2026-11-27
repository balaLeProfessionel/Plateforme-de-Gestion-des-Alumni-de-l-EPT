import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { CriteresOffresEmploi, MotifSignalementOffre, OffreEmploi, OffreRelayeeRequete } from '../models/offre-emploi.model';

const API = '/api/offres-emploi';

/** Offres d’emploi (#221) : consultation, relais d’une offre vue ailleurs, gestion par l’auteur, signalement. */
@Service()
export class OffresEmploiService {
  private readonly http = inject(HttpClient);

  rechercher(criteres: CriteresOffresEmploi, taille = 12) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille).set('expirees', criteres.expirees);
    if (criteres.recherche) params = params.set('q', criteres.recherche);
    if (criteres.type) params = params.set('type', criteres.type);
    if (criteres.lieu) params = params.set('lieu', criteres.lieu);
    if (criteres.filiere) params = params.set('filiere', criteres.filiere);
    return this.http.get<Page<OffreEmploi>>(API, { params });
  }

  detail(id: string) {
    return this.http.get<OffreEmploi>(`${API}/${encodeURIComponent(id)}`);
  }

  mesOffres() {
    return this.http.get<OffreEmploi[]>(`${API}/mes-offres`);
  }

  relayer(offre: OffreRelayeeRequete) {
    return this.http.post<OffreEmploi>(`${API}/relayees`, offre);
  }

  modifier(id: string, offre: OffreRelayeeRequete) {
    return this.http.put<OffreEmploi>(`${API}/${encodeURIComponent(id)}`, offre);
  }

  retirer(id: string) {
    return this.http.patch<OffreEmploi>(`${API}/${encodeURIComponent(id)}/retirer`, {});
  }

  signaler(id: string, motif: MotifSignalementOffre, commentaire: string) {
    return this.http.post<void>(`${API}/${encodeURIComponent(id)}/signalements`, { motif, commentaire: commentaire || null });
  }
}
