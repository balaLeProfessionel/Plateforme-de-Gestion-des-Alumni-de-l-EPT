import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import { CriteresOffres, OffreStage, OffreStageRequete, OrganismeOffres, StatutOffre } from '../models/stage.model';

const API = '/api/stages';
const API_ADMIN = '/api/admin/stages/offres';

/** Offres de stage : consultation par les membres, publication par les organismes, vérification par l’école. */
@Service()
export class OffresStageService {
  private readonly http = inject(HttpClient);

  rechercher(criteres: CriteresOffres, taille = 12) {
    let params = new HttpParams().set('page', criteres.page).set('taille', taille).set('ouvertes', criteres.ouvertes);
    if (criteres.type) params = params.set('type', criteres.type);
    if (criteres.organisme) params = params.set('organisme', criteres.organisme);
    if (criteres.lieu) params = params.set('lieu', criteres.lieu);
    return this.http.get<Page<OffreStage>>(`${API}/offres`, { params });
  }

  organismes() {
    return this.http.get<OrganismeOffres[]>(`${API}/offres/organismes`);
  }

  detail(id: string) {
    return this.http.get<OffreStage>(`${API}/offres/${id}`);
  }

  mesOffres() {
    return this.http.get<OffreStage[]>(`${API}/mes-offres`);
  }

  publier(offre: OffreStageRequete) {
    return this.http.post<OffreStage>(`${API}/mes-offres`, offre);
  }

  retirerMienne(id: string) {
    return this.http.patch<OffreStage>(`${API}/mes-offres/${id}/retirer`, {});
  }

  joindreImage(id: string, image: File) {
    const contenu = new FormData();
    contenu.append('image', image);
    return this.http.post<OffreStage>(`${API}/offres/${id}/image`, contenu);
  }

  supprimerImage(id: string) {
    return this.http.delete<OffreStage>(`${API}/offres/${id}/image`);
  }

  ajouterPiece(id: string, fichier: File) {
    const contenu = new FormData();
    contenu.append('fichier', fichier);
    return this.http.post<OffreStage>(`${API}/offres/${id}/pieces-jointes`, contenu);
  }

  supprimerPiece(id: string, pieceId: string) {
    return this.http.delete<OffreStage>(`${API}/offres/${id}/pieces-jointes/${pieceId}`);
  }

  /** Le PDF passe par HttpClient : la requête porte le jeton, qu’un simple lien n’enverrait pas. */
  telechargerPiece(id: string, pieceId: string) {
    return this.http.get(`${API}/offres/${id}/pieces-jointes/${pieceId}`, { responseType: 'blob' });
  }

  listerPourAdministration(statut: StatutOffre | '', page: number, taille = 20) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (statut) params = params.set('statut', statut);
    return this.http.get<Page<OffreStage>>(API_ADMIN, { params });
  }

  nombreAVerifier() {
    return this.http.get<{ nombre: number }>(`${API_ADMIN}/a-verifier`);
  }

  /** Offre saisie par l’école au nom d’un organisme existant, ou d’un nouveau créé à partir de son nom. */
  saisir(offre: OffreStageRequete, organisme: { organismeId: string } | { nomNouvelOrganisme: string }) {
    return this.http.post<OffreStage>(API_ADMIN, { offre, ...organisme });
  }

  publierSoumise(id: string) {
    return this.http.patch<OffreStage>(`${API_ADMIN}/${id}/publier`, {});
  }

  refuser(id: string, motif: string) {
    return this.http.patch<OffreStage>(`${API_ADMIN}/${id}/refuser`, { motif });
  }

  retirer(id: string, motif: string) {
    return this.http.patch<OffreStage>(`${API_ADMIN}/${id}/retirer`, { motif });
  }
}
