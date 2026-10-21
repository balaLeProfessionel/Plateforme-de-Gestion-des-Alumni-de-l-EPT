import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { roleGuard } from '../../core/guards/auth.guard';
import { VueListeMentorats } from './liste-mentorats/liste-mentorats';

const ETUDIANT = { roles: ['ETUDIANT'] };
const ALUMNI = { roles: ['ALUMNI'] };

const vue = (vue: VueListeMentorats) => ({ vue });

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
        // Chaque rôle arrive sur l’onglet qui le concerne ; les autres voient la présentation du module.
        redirectTo: () => {
          const role = inject(AuthService).utilisateur()?.role;
          if (role === 'ETUDIANT') return 'trouver';
          if (role === 'ALUMNI') return 'recues';
          return 'presentation';
        }
      },
      { path: 'presentation', children: [] },
      {
        path: 'trouver',
        title: 'Trouver un mentor | EPT Alumni',
        canActivate: [roleGuard],
        data: ETUDIANT,
        loadComponent: () => import('./trouver-mentor/trouver-mentor').then((m) => m.TrouverMentor)
      },
      {
        path: 'demandes',
        title: 'Mes demandes de mentorat | EPT Alumni',
        canActivate: [roleGuard],
        data: {
          ...ETUDIANT,
          ...vue({
            role: 'MENTORE',
            statuts: ['EN_ATTENTE', 'REFUSEE', 'ANNULEE'],
            titreVide: 'Aucune demande',
            texteVide: 'Les demandes que vous enverrez à un mentor apparaîtront ici.',
          }),
        },
        loadComponent: () => import('./liste-mentorats/liste-mentorats').then((m) => m.ListeMentorats)
      },
      {
        path: 'suivis',
        title: 'Mes mentorats | EPT Alumni',
        canActivate: [roleGuard],
        data: {
          ...ETUDIANT,
          ...vue({
            role: 'MENTORE',
            statuts: ['ACCEPTEE', 'TERMINEE'],
            titreVide: 'Aucun mentorat en cours',
            texteVide: 'Quand un mentor acceptera votre demande, vous suivrez vos séances ici.',
          }),
        },
        loadComponent: () => import('./liste-mentorats/liste-mentorats').then((m) => m.ListeMentorats)
      },
      {
        path: 'recues',
        title: 'Demandes reçues | EPT Alumni',
        canActivate: [roleGuard],
        data: {
          ...ALUMNI,
          ...vue({
            role: 'MENTOR',
            statuts: ['EN_ATTENTE'],
            titreVide: 'Aucune demande en attente',
            texteVide: 'Les demandes des étudiants arriveront ici. Vérifiez que votre offre est disponible.',
          }),
        },
        loadComponent: () => import('./liste-mentorats/liste-mentorats').then((m) => m.ListeMentorats)
      },
      {
        path: 'mentores',
        title: 'Mes mentorés | EPT Alumni',
        canActivate: [roleGuard],
        data: {
          ...ALUMNI,
          ...vue({
            role: 'MENTOR',
            statuts: ['ACCEPTEE', 'TERMINEE', 'REFUSEE', 'ANNULEE'],
            titreVide: 'Aucun mentoré pour l’instant',
            texteVide: 'Les étudiants que vous accompagnez, et l’historique de vos réponses, apparaîtront ici.',
          }),
        },
        loadComponent: () => import('./liste-mentorats/liste-mentorats').then((m) => m.ListeMentorats)
      },
      {
        path: 'offre',
        title: 'Mon offre de mentorat | EPT Alumni',
        canActivate: [roleGuard],
        data: ALUMNI,
        loadComponent: () => import('./mon-offre/mon-offre').then((m) => m.MonOffre)
      },
    ]
  },
];
