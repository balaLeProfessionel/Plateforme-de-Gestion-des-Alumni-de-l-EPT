import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { roleGuard } from '../../core/guards/auth.guard';
import {
  ROLES_MENTORAT, RoleMentorat, StatutMentorat, participeAuMentorat,
} from '../../core/services/models/mentorat.model';
import { VueListeMentorats } from './liste-mentorats/liste-mentorats';

const PARTICIPANTS = { roles: ROLES_MENTORAT };

const section = (titre: string, role: RoleMentorat, statuts: StatutMentorat[]): VueListeMentorats =>
  ({ titre, role, statuts });

export const MENTORAT_ROUTES: Routes = [
  {
    path: 'suivi/:id',
    title: 'Suivi du mentorat | EPT Alumni',
    loadComponent: () => import('./detail-mentorat/detail-mentorat').then((m) => m.DetailMentorat)
  },
  {
    path: '',
    title: 'Mentorat | EPT Alumni',
    loadComponent: () => import('./mentorat').then((m) => m.MentoratPage),
    children: [
      {
        path: '',
        pathMatch: 'full',
        // Les alumni, souvent mentors, arrivent sur leurs mentorés ; les autres membres sur la recherche.
        redirectTo: () => {
          const role = inject(AuthService).utilisateur()?.role;
          if (role === 'ALUMNI') return 'mentores';
          return participeAuMentorat(role) ? 'trouver' : 'presentation';
        }
      },
      { path: 'presentation', children: [] },
      {
        path: 'trouver',
        title: 'Trouver un mentor | EPT Alumni',
        canActivate: [roleGuard],
        data: PARTICIPANTS,
        loadComponent: () => import('./trouver-mentor/trouver-mentor').then((m) => m.TrouverMentor)
      },
      {
        path: 'mentorats',
        title: 'Mes mentorats | EPT Alumni',
        canActivate: [roleGuard],
        data: {
          ...PARTICIPANTS,
          sections: [
            section('Demandes en attente', 'MENTORE', ['EN_ATTENTE']),
            section('En cours', 'MENTORE', ['ACCEPTEE']),
            section('Historique', 'MENTORE', ['TERMINEE', 'REFUSEE', 'ANNULEE']),
          ],
          titreVide: 'Aucun mentorat pour l’instant',
          texteVide: 'Trouvez un mentor et envoyez-lui une demande : vous la suivrez ici.',
          invitation: { libelle: 'Trouver un mentor', lien: '/mentorat/trouver' },
        },
        loadComponent: () => import('./page-mentorats/page-mentorats').then((m) => m.PageMentorats)
      },
      {
        path: 'mentores',
        title: 'Mes mentorés | EPT Alumni',
        canActivate: [roleGuard],
        data: {
          ...PARTICIPANTS,
          sections: [
            section('À traiter', 'MENTOR', ['EN_ATTENTE']),
            section('En cours', 'MENTOR', ['ACCEPTEE']),
            section('Historique', 'MENTOR', ['TERMINEE', 'REFUSEE', 'ANNULEE']),
          ],
          titreVide: 'Personne à accompagner pour l’instant',
          texteVide: 'Les demandes qu’on vous adresse arriveront ici. Vérifiez que votre offre est disponible.',
          invitation: { libelle: 'Voir mon offre', lien: '/mentorat/offre' },
        },
        loadComponent: () => import('./page-mentorats/page-mentorats').then((m) => m.PageMentorats)
      },
      // Anciennes rubriques (liens déjà envoyés, favoris) : regroupées dans les deux pages ci-dessus.
      { path: 'demandes', redirectTo: 'mentorats' },
      { path: 'suivis', redirectTo: 'mentorats' },
      { path: 'recues', redirectTo: 'mentores' },
      {
        path: 'offre',
        title: 'Mon offre de mentorat | EPT Alumni',
        canActivate: [roleGuard],
        data: PARTICIPANTS,
        loadComponent: () => import('./mon-offre/mon-offre').then((m) => m.MonOffre)
      },
    ]
  },
];
