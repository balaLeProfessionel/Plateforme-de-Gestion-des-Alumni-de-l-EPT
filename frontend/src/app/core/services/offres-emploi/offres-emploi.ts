import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { map } from 'rxjs';
import {
  CriteresOffresEmploi, DernierCv, EnvoiCandidature, MaCandidatureEmploi, MotifSignalementOffre, OffreEmploi, OffreGereeRequete,
  OffreRelayeeRequete,
} from '../models/offre-emploi.model';

const API = '/api/offres-emploi';

/** Offres d’emploi : consultation, relais (#221), publication par un organisme et candidature (#222), signalement. */
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

  publierGeree(offre: OffreGereeRequete) {
    return this.http.post<OffreEmploi>(`${API}/gerees`, offre);
  }

  modifierGeree(id: string, offre: OffreGereeRequete) {
    return this.http.put<OffreEmploi>(`${API}/${encodeURIComponent(id)}/geree`, offre);
  }

  /** Candidature du membre connecté à l’offre, ou null s’il n’a pas postulé (204). */
  maCandidature(offreId: string) {
    return this.http.get<MaCandidatureEmploi | null>(`${API}/${encodeURIComponent(offreId)}/ma-candidature`)
      .pipe(map((c) => c ?? null));
  }

  /** CV (nouveau fichier ou reprise du dernier), lettre et réponses en JSON, dans un envoi multipart. */
  postuler(offreId: string, envoi: EnvoiCandidature) {
    const contenu = new FormData();
    if (envoi.cv) contenu.append('cv', envoi.cv);
    else if (envoi.reprendreCv) contenu.append('reprendreCv', 'true');
    if (envoi.lettre.trim()) contenu.append('lettre', envoi.lettre.trim());
    contenu.append('reponses', new Blob([JSON.stringify(envoi.reponses)], { type: 'application/json' }));
    return this.http.post<MaCandidatureEmploi>(`${API}/${encodeURIComponent(offreId)}/candidature`, contenu);
  }

  retirerCandidature(offreId: string) {
    return this.http.patch<MaCandidatureEmploi>(`${API}/${encodeURIComponent(offreId)}/candidature/retirer`, {});
  }

  mesCandidatures() {
    return this.http.get<MaCandidatureEmploi[]>(`${API}/mes-candidatures`);
  }

  /** Dernier CV envoyé (stage ou emploi), ou null. */
  dernierCv() {
    return this.http.get<DernierCv | null>(`${API}/mon-dernier-cv`).pipe(map((cv) => cv ?? null));
  }

  telechargerCv(candidatureId: string) {
    return this.http.get(`${API}/candidatures/${encodeURIComponent(candidatureId)}/cv`, { responseType: 'blob' });
  }

  signaler(id: string, motif: MotifSignalementOffre, commentaire: string) {
    return this.http.post<void>(`${API}/${encodeURIComponent(id)}/signalements`, { motif, commentaire: commentaire || null });
  }
}
