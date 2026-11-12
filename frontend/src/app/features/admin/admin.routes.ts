import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/auth.guard';

/** Chaque rubrique exige sa permission ; la navigation par domaine est dans la barre latérale. */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Tableau de bord | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'CONSULTER_TABLEAU_DE_BORD' },
    loadComponent: () => import('./tableau-de-bord/tableau-de-bord').then((m) => m.TableauDeBord),
  },
  {
    path: 'inscriptions',
    title: 'Inscriptions à examiner | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'GERER_COMPTES' },
    loadComponent: () => import('./inscriptions/inscriptions').then((m) => m.Inscriptions),
  },
  {
    path: 'comptes',
    title: 'Comptes | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'GERER_COMPTES' },
    loadComponent: () => import('./comptes/comptes').then((m) => m.Comptes),
  },
  {
    path: 'comptes/nouveau',
    title: 'Créer un compte | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'GERER_COMPTES' },
    loadComponent: () => import('./nouveau-compte/nouveau-compte').then((m) => m.NouveauCompte),
  },
  {
    path: 'comptes/import',
    title: 'Importer une promotion | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'GERER_COMPTES' },
    loadComponent: () => import('./import-comptes/import-comptes').then((m) => m.ImportComptes),
  },
  {
    path: 'diplomes',
    title: 'Diplômés | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'GERER_COMPTES' },
    loadComponent: () => import('./diplomes/diplomes').then((m) => m.Diplomes),
  },
  {
    path: 'comptes/:id',
    title: 'Fiche du compte | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'GERER_COMPTES' },
    loadComponent: () => import('./fiche-compte/fiche-compte').then((m) => m.FicheComptePage),
  },
  {
    path: 'publications',
    title: 'Annonces et appels à projets | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'PUBLIER_ANNONCES' },
    loadComponent: () => import('./publications-officielles/publications-officielles').then((m) => m.PublicationsOfficielles),
  },
  {
    path: 'signalements',
    title: 'Signalements | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'MODERER_PUBLICATIONS' },
    loadComponent: () => import('./signalements/signalements').then((m) => m.Signalements),
  },
  {
    path: 'journal',
    title: 'Journal des décisions | EPT Alumni',
    canActivate: [permissionGuard],
    data: { permission: 'CONSULTER_JOURNAL' },
    loadComponent: () => import('./journal/journal').then((m) => m.Journal),
  },
];
