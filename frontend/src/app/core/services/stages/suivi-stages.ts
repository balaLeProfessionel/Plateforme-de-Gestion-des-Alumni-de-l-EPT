import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Page } from '../models/mentorat.model';
import {
  ClausesConvention, Convention, MesSuivis, PartieConvention, PersonnelSuggestion, SuiviStage, Tuteur,
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
}
