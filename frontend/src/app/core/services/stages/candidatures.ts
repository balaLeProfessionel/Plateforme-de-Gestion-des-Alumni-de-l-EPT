import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map } from 'rxjs';
import { AvisOrganisme, CandidatureRecue, MaCandidature } from '../models/stage.model';

const API = '/api/stages';

/** Candidatures aux offres de stage : l’étudiant postule et suit, l’organisme et l’école consultent. */
@Service()
export class CandidaturesService {
  private readonly http = inject(HttpClient);

  /** Candidature de l’étudiant connecté à l’offre, ou null s’il n’a pas postulé (204). */
  maCandidature(offreId: string) {
    return this.http.get<MaCandidature | null>(`${API}/offres/${offreId}/ma-candidature`).pipe(map((c) => c ?? null));
  }

  /** Premier envoi (CV obligatoire) ou renvoi (CV facultatif : l’ancien est gardé). */
  postuler(offreId: string, cv: File | null, lettre: string) {
    const contenu = new FormData();
    if (cv) contenu.append('cv', cv);
    if (lettre.trim()) contenu.append('lettre', lettre.trim());
    return this.http.post<MaCandidature>(`${API}/offres/${offreId}/candidature`, contenu);
  }

  retirer(offreId: string) {
    return this.http.patch<MaCandidature>(`${API}/offres/${offreId}/candidature/retirer`, {});
  }

  mesCandidatures() {
    return this.http.get<MaCandidature[]>(`${API}/mes-candidatures`);
  }

  recues(offreId: string) {
    return this.http.get<CandidatureRecue[]>(`${API}/offres/${offreId}/candidatures`);
  }

  donnerAvis(candidatureId: string, avis: AvisOrganisme) {
    return this.http.patch<CandidatureRecue>(`${API}/candidatures/${candidatureId}/avis`, { avis });
  }

  /** Le CV passe par HttpClient : la requête porte le jeton. */
  telechargerCv(candidatureId: string) {
    return this.http.get(`${API}/candidatures/${candidatureId}/cv`, { responseType: 'blob' });
  }
}
