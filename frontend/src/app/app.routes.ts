import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'connexion', pathMatch: 'full' },
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/connexion/connexion').then((m) => m.Connexion)
  },
  {
    path: 'accueil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/accueil/accueil').then((m) => m.Accueil)
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
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/organisme/completer-organisme/completer-organisme').then((m) => m.CompleterOrganisme)
  },
];
