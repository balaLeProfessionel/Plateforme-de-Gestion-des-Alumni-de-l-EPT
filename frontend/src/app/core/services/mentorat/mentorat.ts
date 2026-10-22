import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {
  CompteursMentorat,
  CriteresMentors,
  DomaineMentorat,
  EvaluationMentorat,
  Mentor,
  Mentorat,
  MentoratDetail,
  Page,
  ProfilMentor,
  ProfilMentorRequest,
  RoleMentorat,
  SeanceMentorat,
  SeanceMentoratRequest,
  StatutMentorat,
  StatutSeance,
} from '../models/mentorat.model';

const API = '/api/mentorat';

@Service()
export class MentoratService {
  private readonly http = inject(HttpClient);

  listerDomaines() {
    return this.http.get<DomaineMentorat[]>(`${API}/domaines`);
  }

  /** Répond 404 tant que l’alumni n’a pas proposé de mentorat. */
  obtenirMonProfil() {
    return this.http.get<ProfilMentor>(`${API}/profil`);
  }

  enregistrerMonProfil(profil: ProfilMentorRequest) {
    return this.http.put<ProfilMentor>(`${API}/profil`, profil);
  }

  /** Offre d'un alumni vue depuis son profil ; 404 s'il ne propose pas de mentorat. */
  obtenirMentor(utilisateurId: string) {
    return this.http.get<Mentor>(`${API}/mentors/utilisateur/${encodeURIComponent(utilisateurId)}`);
  }

  rechercherMentors({ recherche, domaine, disponibles, page, programme }: CriteresMentors, taille = 12) {
    let params = new HttpParams().set('page', page).set('taille', taille).set('disponibles', disponibles);
    if (recherche.trim()) params = params.set('recherche', recherche.trim());
    if (domaine) params = params.set('domaine', domaine);
    if (programme) params = params.set('programme', programme);
    return this.http.get<Page<Mentor>>(`${API}/mentors`, { params });
  }

  /** Une demande faite depuis la page d’un programme y est rattachée par `programmeId`. */
  demander(profilMentorId: string, domaineId: string, objectif: string, programmeId: string | null = null) {
    return this.http.post<Mentorat>(`${API}/mentorats`, { profilMentorId, domaineId, objectif, programmeId });
  }

  lister(role: RoleMentorat, statuts: readonly StatutMentorat[], page: number, taille = 12) {
    let params = new HttpParams().set('role', role).set('page', page).set('taille', taille);
    for (const statut of statuts) params = params.append('statut', statut);
    return this.http.get<Page<Mentorat>>(`${API}/mentorats`, { params });
  }

  compter() {
    return this.http.get<CompteursMentorat>(`${API}/mentorats/compteurs`);
  }

  obtenir(id: string) {
    return this.http.get<MentoratDetail>(`${API}/mentorats/${encodeURIComponent(id)}`);
  }

  accepter(id: string) {
    return this.http.patch<Mentorat>(`${API}/mentorats/${encodeURIComponent(id)}/accepter`, {});
  }

  refuser(id: string, motif: string | null) {
    return this.http.patch<Mentorat>(`${API}/mentorats/${encodeURIComponent(id)}/refuser`, { motif });
  }

  annuler(id: string) {
    return this.http.patch<Mentorat>(`${API}/mentorats/${encodeURIComponent(id)}/annuler`, {});
  }

  terminer(id: string) {
    return this.http.patch<Mentorat>(`${API}/mentorats/${encodeURIComponent(id)}/terminer`, {});
  }

  planifierSeance(id: string, seance: SeanceMentoratRequest) {
    return this.http.post<SeanceMentorat>(`${API}/mentorats/${encodeURIComponent(id)}/seances`, seance);
  }

  modifierSeance(id: string, seanceId: string, seance: SeanceMentoratRequest) {
    return this.http.put<SeanceMentorat>(
      `${API}/mentorats/${encodeURIComponent(id)}/seances/${encodeURIComponent(seanceId)}`, seance);
  }

  suivreSeance(id: string, seanceId: string, statut: StatutSeance, compteRendu: string | null) {
    return this.http.patch<SeanceMentorat>(
      `${API}/mentorats/${encodeURIComponent(id)}/seances/${encodeURIComponent(seanceId)}`,
      { statut, compteRendu });
  }

  evaluer(id: string, note: number, commentaire: string | null) {
    return this.http.post<EvaluationMentorat>(
      `${API}/mentorats/${encodeURIComponent(id)}/evaluation`, { note, commentaire });
  }
}
