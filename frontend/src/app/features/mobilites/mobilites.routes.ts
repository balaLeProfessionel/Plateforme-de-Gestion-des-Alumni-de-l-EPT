import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

/**
 * Module Mobilités : les offres pour les étudiants et les enseignants, la publication pour les instituts partenaires.
 * Le détail et la modification sont aussi ouverts au chef du service mobilité ; le serveur vérifie les droits.
 */
export const MOBILITES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Offres de mobilité | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ETUDIANT', 'PERSONNEL'] },
    loadComponent: () => import('./liste-offres-mobilite/liste-offres-mobilite').then((m) => m.ListeOffresMobilite),
  },
  {
    path: 'offres/:id',
    title: 'Offre de mobilité | EPT Alumni',
    loadComponent: () => import('./detail-offre-mobilite/detail-offre-mobilite').then((m) => m.DetailOffreMobilite),
  },
  {
    path: 'offres/:id/modifier',
    title: 'Modifier une offre de mobilité | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME', 'ADMIN'] },
    loadComponent: () => import('./formulaire-offre-mobilite/formulaire-offre-mobilite').then((m) => m.FormulaireOffreMobilite),
  },
  {
    path: 'mes-candidatures',
    title: 'Mes candidatures de mobilité | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ETUDIANT', 'PERSONNEL'] },
    loadComponent: () => import('./mes-candidatures-mobilite/mes-candidatures-mobilite').then((m) => m.MesCandidaturesMobilite),
  },
  {
    path: 'mes-offres',
    title: 'Mes offres de mobilité | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./mes-offres-mobilite/mes-offres-mobilite').then((m) => m.MesOffresMobilite),
  },
  {
    path: 'mes-offres/:id/retenus',
    title: 'Candidats retenus | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./retenus-mobilite/retenus-mobilite').then((m) => m.RetenusMobilite),
  },
  {
    path: 'publier',
    title: 'Publier une offre de mobilité | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./formulaire-offre-mobilite/formulaire-offre-mobilite').then((m) => m.FormulaireOffreMobilite),
  },
];
