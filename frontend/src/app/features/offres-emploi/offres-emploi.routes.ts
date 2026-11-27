import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

/** Rôles qui relaient une offre vue ailleurs (même règle que le serveur). */
const ROLES_QUI_RELAIENT = ['ETUDIANT', 'ALUMNI', 'PERSONNEL'];
/** Rôles qui postulent aux offres gérées (même règle que le serveur). */
const ROLES_CANDIDATS = ['ETUDIANT', 'ALUMNI'];

/**
 * Offres d’emploi : la liste pour les membres liés à l’école ; le relais et « Mes offres » pour ceux qui relaient (#221) ;
 * la publication pour les organismes et « Mes candidatures » pour les candidats (#222).
 */
export const OFFRES_EMPLOI_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Offres d’emploi | EPT Alumni',
    loadComponent: () => import('./liste-offres-emploi/liste-offres-emploi').then((m) => m.ListeOffresEmploi),
  },
  {
    path: 'relayer',
    title: 'Relayer une offre | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ROLES_QUI_RELAIENT },
    loadComponent: () => import('./formulaire-offre-relayee/formulaire-offre-relayee').then((m) => m.FormulaireOffreRelayee),
  },
  {
    path: 'publier',
    title: 'Publier une offre d’emploi | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./formulaire-offre-geree/formulaire-offre-geree').then((m) => m.FormulaireOffreGeree),
  },
  {
    path: 'mes-offres',
    title: 'Mes offres d’emploi | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: [...ROLES_QUI_RELAIENT, 'ORGANISME'] },
    loadComponent: () => import('./mes-offres-emploi/mes-offres-emploi').then((m) => m.MesOffresEmploi),
  },
  {
    path: 'mes-candidatures',
    title: 'Mes candidatures | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ROLES_CANDIDATS },
    loadComponent: () => import('./mes-candidatures-emploi/mes-candidatures-emploi').then((m) => m.MesCandidaturesEmploi),
  },
  {
    path: ':id/modifier',
    title: 'Modifier une offre | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ROLES_QUI_RELAIENT },
    loadComponent: () => import('./formulaire-offre-relayee/formulaire-offre-relayee').then((m) => m.FormulaireOffreRelayee),
  },
  {
    path: ':id/modifier-offre',
    title: 'Modifier une offre | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./formulaire-offre-geree/formulaire-offre-geree').then((m) => m.FormulaireOffreGeree),
  },
  {
    path: ':id',
    title: 'Offre d’emploi | EPT Alumni',
    loadComponent: () => import('./detail-offre-emploi/detail-offre-emploi').then((m) => m.DetailOffreEmploi),
  },
];
