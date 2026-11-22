import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { CriteresOffresMobilite, OffreMobilite, OffreMobiliteRequete, StatutOffreMobilite } from '../models/mobilite.model';

const API = '/api/mobilites';
const API_ADMIN = '/api/admin/mobilites/offres';

/** Offres de mobilité : consultation par les étudiants et les enseignants, publication par les instituts et le chef du service mobilité. */
@Service()
export class OffresMobiliteService {
  private readonly http = inject(HttpClient);

  rechercher(criteres: CriteresOffresMobilite, taille = 12) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille).set('eligibles', criteres.eligibles);
    if (criteres.type) params = params.set('type', criteres.type);
    if (criteres.pays) params = params.set('pays', criteres.pays);
    if (criteres.periode) params = params.set('periode', criteres.periode);
    if (criteres.annee) params = params.set('annee', criteres.annee);
    return this.http.get<Page<OffreMobilite>>(`${API}/offres`, { params });
  }

  detail(id: string) {
    return this.http.get<OffreMobilite>(`${API}/offres/${id}`);
  }

  mesOffres() {
    return this.http.get<OffreMobilite[]>(`${API}/mes-offres`);
  }

  publier(offre: OffreMobiliteRequete) {
    return this.http.post<OffreMobilite>(`${API}/mes-offres`, offre);
  }

  modifier(id: string, offre: OffreMobiliteRequete) {
    return this.http.put<OffreMobilite>(`${API}/offres/${id}`, offre);
  }

  cloturer(id: string) {
    return this.http.patch<OffreMobilite>(`${API}/offres/${id}/cloturer`, {});
  }

  ajouterPiece(id: string, fichier: File) {
    const contenu = new FormData();
    contenu.append('fichier', fichier);
    return this.http.post<OffreMobilite>(`${API}/offres/${id}/pieces-jointes`, contenu);
  }

  supprimerPiece(id: string, pieceId: string) {
    return this.http.delete<OffreMobilite>(`${API}/offres/${id}/pieces-jointes/${pieceId}`);
  }

  /** Le PDF passe par HttpClient : la requête porte le jeton, qu’un simple lien n’enverrait pas. */
  telechargerPiece(id: string, pieceId: string) {
    return this.http.get(`${API}/offres/${id}/pieces-jointes/${pieceId}`, { responseType: 'blob' });
  }

  listerPourChef(statut: StatutOffreMobilite | '', page: number, taille = 20) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (statut) params = params.set('statut', statut);
    return this.http.get<Page<OffreMobilite>>(API_ADMIN, { params });
  }

  /** Offre publiée par le chef au nom d’un établissement existant, ou d’un nouveau créé à partir de son nom. */
  publierParChef(offre: OffreMobiliteRequete, organisme: { organismeId: string } | { nomNouvelOrganisme: string }) {
    return this.http.post<OffreMobilite>(API_ADMIN, { offre, ...organisme });
  }

  retirer(id: string, motif: string) {
    return this.http.patch<OffreMobilite>(`${API_ADMIN}/${id}/retirer`, { motif });
  }
}
