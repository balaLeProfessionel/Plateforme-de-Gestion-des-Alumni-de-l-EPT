import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

/** Module Stages (STA-01 à STA-04, STA-09) : les offres pour tous les membres connectés, la publication pour les organismes. */
export const STAGES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Offres de stage | EPT Alumni',
    loadComponent: () => import('./liste-offres/liste-offres').then((m) => m.ListeOffres),
  },
  {
    path: 'offres/:id',
    title: 'Offre de stage | EPT Alumni',
    loadComponent: () => import('./detail-offre/detail-offre').then((m) => m.DetailOffre),
  },
  {
    path: 'mes-offres',
    title: 'Mes offres de stage | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./mes-offres/mes-offres').then((m) => m.MesOffres),
  },
  {
    path: 'mes-offres/:id/candidatures',
    title: 'Candidatures reçues | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./candidatures-recues/candidatures-recues').then((m) => m.CandidaturesRecues),
  },
  {
    path: 'mes-candidatures',
    title: 'Mes candidatures | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ETUDIANT'] },
    loadComponent: () => import('./mes-candidatures/mes-candidatures').then((m) => m.MesCandidatures),
  },
  {
    path: 'mes-stages',
    title: 'Mes stages | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ETUDIANT'] },
    loadComponent: () => import('./mes-stages/mes-stages').then((m) => m.MesStages),
  },
  {
    path: 'suivi',
    title: 'Suivi des stages | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['PERSONNEL', 'ORGANISME'] },
    loadComponent: () => import('./suivi-stages/suivi-stages').then((m) => m.SuiviStagesMembre),
  },
  {
    path: 'indicateurs',
    title: 'Mes indicateurs | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./indicateurs-organisme/indicateurs-organisme').then((m) => m.IndicateursOrganismePage),
  },
  {
    path: 'suivi/:id/evaluation',
    title: 'Évaluation du stagiaire | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['PERSONNEL', 'ORGANISME'] },
    loadComponent: () => import('./evaluation-stage/evaluation-stage').then((m) => m.EvaluationStagePage),
  },
  {
    path: 'declarer',
    title: 'Déclarer un stage | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ETUDIANT'] },
    loadComponent: () => import('./declarer-stage/declarer-stage').then((m) => m.DeclarerStage),
  },
  {
    path: 'publier',
    title: 'Publier une offre de stage | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./formulaire-offre/formulaire-offre').then((m) => m.FormulaireOffre),
  },
];
