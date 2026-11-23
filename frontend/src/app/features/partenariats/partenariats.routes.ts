import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

/** Partenariat avec l’EPT, côté organisme : ses conventions-cadres, de la demande à la fin de validité. */
export const PARTENARIATS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Partenariat avec l’EPT | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./mes-conventions/mes-conventions').then((m) => m.MesConventions),
  },
  {
    path: 'demander',
    title: 'Demander une convention | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./demande-convention/demande-convention').then((m) => m.DemandeConvention),
  },
  {
    path: 'conventions/:id',
    title: 'Convention de partenariat | EPT Alumni',
    canActivate: [roleGuard],
    data: { roles: ['ORGANISME'] },
    loadComponent: () => import('./detail-convention/detail-convention').then((m) => m.DetailConvention),
  },
];
