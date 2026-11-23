import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { CritereEtudiants, EtudiantSuggestion, ListeDefinitive, IndicateursOrganisme, MonStage, Stagiaire } from '../models/stage.model';

const API = '/api/stages';
const API_ADMIN = '/api/admin/stages';

/** Liste définitive d’une offre (STA-04) : composée et publiée par l’école, consultée par l’organisme et l’étudiant. */
@Service()
export class ListeDefinitiveService {
  private readonly http = inject(HttpClient);

  liste(offreId: string) {
    return this.http.get<ListeDefinitive>(`${API_ADMIN}/offres/${offreId}/liste`);
  }

  /** Sans dates, le serveur reprend celles de l’offre si elle en a. */
  ajouter(offreId: string, etudiantId: string, dateDebut: string | null = null, dateFin: string | null = null) {
    return this.http.post<ListeDefinitive>(`${API_ADMIN}/offres/${offreId}/liste`, { etudiantId, dateDebut, dateFin });
  }

  modifierDates(ligneId: string, dateDebut: string, dateFin: string) {
    return this.http.patch<ListeDefinitive>(`${API_ADMIN}/liste/${ligneId}/dates`, { dateDebut, dateFin });
  }

  /** En brouillon, la ligne disparaît ; après publication, le stage est annulé avec ce motif. */
  retirer(ligneId: string, motif: string | null) {
    return this.http.patch<ListeDefinitive>(`${API_ADMIN}/liste/${ligneId}/retirer`, { motif });
  }

  publier(offreId: string) {
    return this.http.patch<ListeDefinitive>(`${API_ADMIN}/offres/${offreId}/liste/publier`, {});
  }

  suggererEtudiants(criteres: CritereEtudiants) {
    let params = new HttpParams();
    // Le serveur ignore un nom de moins de deux lettres : il n’est pas envoyé.
    if (criteres.texte.trim().length >= 2) params = params.set('q', criteres.texte.trim());
    if (criteres.classe) params = params.set('classe', criteres.classe);
    if (criteres.filiere) params = params.set('filiere', criteres.filiere);
    return this.http.get<EtudiantSuggestion[]>(`${API_ADMIN}/etudiants`, { params });
  }

  stagiaires(offreId: string) {
    return this.http.get<Stagiaire[]>(`${API}/offres/${offreId}/stagiaires`);
  }

  mesStages() {
    return this.http.get<MonStage[]>(`${API}/mes-stages`);
  }

  /** Indicateurs de l’organisme connecté avec l’école (STA-13). */
  mesIndicateurs() {
    return this.http.get<IndicateursOrganisme>(`${API}/mes-indicateurs`);
  }
}
