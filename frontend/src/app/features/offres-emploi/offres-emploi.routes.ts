import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

/** Rôles qui relaient une offre vue ailleurs (même règle que le serveur). */
const ROLES_QUI_RELAIENT = ['ETUDIANT', 'ALUMNI', 'PERSONNEL'];

/** Offres d’emploi (#221) : la liste pour les membres liés à l’école, le relais et « Mes offres » pour ceux qui relaient. */
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
    path: 'mes-offres',
    title: 'Mes offres relayées | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ROLES_QUI_RELAIENT },
    loadComponent: () => import('./mes-offres-emploi/mes-offres-emploi').then((m) => m.MesOffresEmploi),
  },
  {
    path: ':id/modifier',
    title: 'Modifier une offre | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ROLES_QUI_RELAIENT },
    loadComponent: () => import('./formulaire-offre-relayee/formulaire-offre-relayee').then((m) => m.FormulaireOffreRelayee),
  },
  {
    path: ':id',
    title: 'Offre d’emploi | EPT Alumni',
    loadComponent: () => import('./detail-offre-emploi/detail-offre-emploi').then((m) => m.DetailOffreEmploi),
  },
];
