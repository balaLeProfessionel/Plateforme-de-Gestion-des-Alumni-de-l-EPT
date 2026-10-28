import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import {
  authGuard,
  changementInitialRequisGuard, accueilAdministrationGuard,
  changementInitialSeulementGuard,
  roleGuard
} from './core/guards/auth.guard';
import { titreProfil } from './features/profil/consultation-profil/titre-profil';

export const routes: Routes = [
  { path: '', redirectTo: 'connexion', pathMatch: 'full' },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/connexion/connexion').then((m) => m.Connexion)
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./features/auth/mot-de-passe-oublie/mot-de-passe-oublie').then(
        (m) => m.MotDePasseOublie
      )
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('./features/auth/reinitialiser-mot-de-passe/reinitialiser-mot-de-passe').then(
        (m) => m.ReinitialiserMotDePasse
      )
  },
  {
    path: 'premiere-connexion',
    canActivate: [authGuard, changementInitialSeulementGuard],
    loadComponent: () =>
      import('./features/auth/premiere-connexion/premiere-connexion').then(
        (m) => m.PremiereConnexion
      )
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/inscription/choix-role/choix-role').then((m) => m.ChoixRole)
  },
  {
    path: 'inscription/formulaire/:role',
    loadComponent: () =>
      import('./features/auth/inscription/formulaire/formulaire').then((m) => m.Formulaire)
  },
  {
    path: 'inscription/verification',
    loadComponent: () =>
      import('./features/auth/inscription/verification/verification').then((m) => m.Verification)
  },
  {
    // Parcours de completion en trois etapes. Le garde est declare une seule
    // fois ici : les routes enfants en heritent.
    path: 'completer-profil',
    canActivate: [authGuard, changementInitialRequisGuard, roleGuard],
    data: { roles: ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'] },
    loadComponent: () =>
      import('./features/profil/completer-profil/parcours-completion/parcours-completion').then(
        (m) => m.ParcoursCompletion
      ),
    children: [
      { path: '', redirectTo: 'infos', pathMatch: 'full' },
      {
        path: 'infos',
        data: { etape: 1 },
        loadComponent: () =>
          import('./features/profil/completer-profil/etape-infos/etape-infos').then(
            (m) => m.EtapeInfos
          )
      },
      {
        path: 'formations',
        data: { etape: 2 },
        loadComponent: () =>
          import('./features/profil/completer-profil/etape-formations/etape-formations').then(
            (m) => m.EtapeFormations
          )
      },
      {
        path: 'experiences',
        data: { etape: 3 },
        loadComponent: () =>
          import('./features/profil/completer-profil/etape-experiences/etape-experiences').then(
            (m) => m.EtapeExperiences
          )
      }
    ]
  },
  {
    path: 'completer-organisme',
    canActivate: [authGuard, changementInitialRequisGuard, roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () =>
      import('./features/organisme/completer-organisme/completer-organisme').then((m) => m.CompleterOrganisme)
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/espace-membre/espace-membre').then((m) => m.EspaceMembre),
    children: [
      {
        path: 'organisme/parametres',
        title: 'Profil de mon organisme | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard, roleGuard],
        data: { roles: ['ORGANISME'] },
        loadComponent: () =>
          import('./features/organisme/completer-organisme/completer-organisme').then(
            (m) => m.CompleterOrganisme
          )
      },
      {
        path: 'accueil',
        title: 'Accueil | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard, accueilAdministrationGuard],
        loadComponent: () =>
          import('./features/accueil/accueil').then((m) => m.Accueil)
      },
      {
        path: 'annuaire',
        title: 'Annuaire | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/annuaire/annuaire').then((m) => m.Annuaire)
      },
      {
        path: 'evenements',
        title: 'Événements | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/evenements/liste-evenements/liste-evenements').then(
            (m) => m.ListeEvenements
          )
      },
      {
        path: 'evenements/creer',
        title: 'Créer un événement | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/evenements/formulaire-evenement/formulaire-evenement').then(
            (m) => m.FormulaireEvenement
          )
      },
      {
        path: 'evenements/mes-evenements',
        redirectTo: (route) => inject(Router).createUrlTree(['/evenements'], {
          queryParams: { ...route.queryParams, vue: 'mes' }
        })
      },
      {
        path: 'evenements/:id/modifier',
        title: 'Modifier un événement | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/evenements/formulaire-evenement/formulaire-evenement').then(
            (m) => m.FormulaireEvenement
          )
      },
      {
        path: 'evenements/:id',
        title: 'Détail de l’événement | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/evenements/detail-evenement/detail-evenement').then(
            (m) => m.DetailEvenement
          )
      },
      {
        path: 'mentorat',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadChildren: () => import('./features/mentorat/mentorat.routes').then((m) => m.MENTORAT_ROUTES)
      },
      {
        path: 'admin',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES)
      },
      {
        path: 'organismes/:id',
        title: 'Organisme | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/organisme/consultation-organisme/consultation-organisme').then(
            (m) => m.ConsultationOrganisme
          )
      },
      {
        path: 'profil',
        title: 'Mon profil | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard, roleGuard],
        data: { roles: ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'] },
        loadComponent: () =>
          import('./features/profil/consultation-profil/consultation-profil').then(
            (m) => m.ConsultationProfil
          )
      },
      {
        path: 'profil/parametres',
        title: 'Modifier mon profil | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard, roleGuard],
        data: { roles: ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'] },
        loadComponent: () =>
          import('./features/profil/parametres-profil/parametres-profil').then(
            (m) => m.ParametresProfil
          )
      },
      {
        // Ancienne page de détail : le profil s’ouvre avec la fenêtre de l’étape (les liens partagés restent valides).
        path: 'profil/:id/experience/:parcoursId',
        redirectTo: ({ params }) =>
          inject(Router).createUrlTree(['/profil', params['id']], { queryParams: { experience: params['parcoursId'] } })
      },
      {
        // Ancienne page de détail : le profil s’ouvre avec la fenêtre de l’étape (les liens partagés restent valides).
        path: 'profil/:id/formation/:parcoursId',
        redirectTo: ({ params }) =>
          inject(Router).createUrlTree(['/profil', params['id']], { queryParams: { formation: params['parcoursId'] } })
      },
      {
        path: 'profil/:id',
        title: titreProfil,
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/profil/consultation-profil/consultation-profil').then(
            (m) => m.ConsultationProfil
          )
      }
    ]
  },
  { path: '**', redirectTo: 'connexion' },
];
