import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import {
  ClausesConvention, Convention, Evaluation, Rapport, SaisieEvaluation, MesSuivis, PartieConvention, PersonnelSuggestion, SuiviStage, Tuteur,
} from '../models/stage.model';

const API_ADMIN = '/api/admin/stages';

/** Suivi des stages confirmés (STA-08) : administration, encadrant interne, chef de département, organisme d’accueil. */
@Service()
export class SuiviStagesService {
  private readonly http = inject(HttpClient);

  lister(criteres: { texte: string; filiere: string; sansEncadrant: boolean }, page: number, taille = 20) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (criteres.texte.trim()) params = params.set('q', criteres.texte.trim());
    if (criteres.filiere) params = params.set('filiere', criteres.filiere);
    if (criteres.sansEncadrant) params = params.set('sansEncadrant', true);
    return this.http.get<Page<SuiviStage>>(`${API_ADMIN}/suivi`, { params });
  }

  /** null retire l’encadrant. */
  designerEncadrant(stageId: string, encadrantId: string | null) {
    return this.http.patch<SuiviStage>(`${API_ADMIN}/suivi/${stageId}/encadrant`, { encadrantId });
  }

  modifierTuteur(stageId: string, tuteur: Tuteur) {
    return this.http.patch<SuiviStage>(`${API_ADMIN}/suivi/${stageId}/tuteur`, tuteur);
  }

  suggererPersonnel(texte: string) {
    return this.http.get<PersonnelSuggestion[]>(`${API_ADMIN}/personnel`, { params: new HttpParams().set('q', texte) });
  }

  mesSuivis() {
    return this.http.get<MesSuivis>('/api/stages/suivi');
  }

  convention(stageId: string) {
    return this.http.get<Convention>(`${API_ADMIN}/suivi/${stageId}/convention`);
  }

  enregistrerClauses(stageId: string, clauses: ClausesConvention) {
    return this.http.put<Convention>(`${API_ADMIN}/suivi/${stageId}/convention`, clauses);
  }

  /** date null retire la signature (saisie erronée). */
  signer(stageId: string, partie: PartieConvention, date: string | null) {
    return this.http.patch<Convention>(`${API_ADMIN}/suivi/${stageId}/convention/signature`, { partie, date });
  }

  deposerScan(stageId: string, fichier: File) {
    const corps = new FormData();
    corps.append('fichier', fichier);
    return this.http.post<Convention>(`${API_ADMIN}/suivi/${stageId}/convention/scan`, corps);
  }

  telechargerScan(stageId: string) {
    return this.http.get(`${API_ADMIN}/suivi/${stageId}/convention/scan`, { responseType: 'blob' });
  }

  /** Date limite de dépôt du rapport, pour un ou plusieurs stages. */
  fixerDateLimiteRapports(stageIds: string[], dateLimite: string) {
    return this.http.patch<{ misAJour: number }>(`${API_ADMIN}/rapports/date-limite`, { stageIds, dateLimite });
  }

  /** Convention signée ; ecole : route d’administration, sinon celle des membres qui suivent le stage. */
  telechargerConvention(stageId: string, ecole: boolean) {
    return this.http.get(ecole ? `${API_ADMIN}/suivi/${stageId}/convention/scan` : `/api/stages/suivi/${stageId}/convention/scan`,
      { responseType: 'blob' });
  }

  deposerRapport(stageId: string, fichier: File) {
    const corps = new FormData();
    corps.append('fichier', fichier);
    return this.http.post<Rapport>(`/api/stages/suivi/${stageId}/rapport`, corps);
  }

  telechargerRapport(stageId: string, ecole: boolean) {
    return this.http.get(`${ecole ? API_ADMIN : '/api/stages'}/suivi/${stageId}/rapport/fichier`, { responseType: 'blob' });
  }

  /** ecole : l’administrateur Stages ; sinon l’organisme, l’encadrant ou le chef de département. */
  evaluation(stageId: string, ecole: boolean) {
    return this.http.get<Evaluation>(urlEvaluation(stageId, ecole));
  }

  enregistrerEvaluation(stageId: string, ecole: boolean, saisie: SaisieEvaluation) {
    return this.http.put<Evaluation>(urlEvaluation(stageId, ecole), saisie);
  }

  soumettreEvaluation(stageId: string, ecole: boolean, saisie: SaisieEvaluation) {
    return this.http.post<Evaluation>(`${urlEvaluation(stageId, ecole)}/soumettre`, saisie);
  }

  rouvrirEvaluation(stageId: string) {
    return this.http.post<Evaluation>(`${urlEvaluation(stageId, true)}/rouvrir`, null);
  }

  /** null annule la décision. */
  deciderStage(stageId: string, valide: boolean | null) {
    return this.http.patch<Evaluation>(`${urlEvaluation(stageId, true)}/decision`, { valide });
  }
}

function urlEvaluation(stageId: string, ecole: boolean): string {
  return `${ecole ? API_ADMIN : '/api/stages'}/suivi/${stageId}/evaluation`;
}
