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
  }
];
