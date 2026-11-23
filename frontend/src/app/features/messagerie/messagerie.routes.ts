import { Routes } from '@angular/router';

/** Messagerie : la page cadre garde la liste ; l’enfant est le fil ouvert, ou l’invitation à en choisir un. */
export const MESSAGERIE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./page-messagerie/page-messagerie').then((m) => m.PageMessagerie),
    children: [
      {
        path: '',
        title: 'Messagerie | EPT Alumni',
        loadComponent: () => import('./aucune-conversation').then((m) => m.AucuneConversation),
      },
      {
        path: ':id/membres',
        title: 'Membres de la communauté | EPT Alumni',
        loadComponent: () => import('./annuaire-communaute/annuaire-communaute').then((m) => m.AnnuaireCommunaute),
      },
      {
        path: ':id',
        title: 'Conversation | EPT Alumni',
        loadComponent: () => import('./fil-conversation/fil-conversation').then((m) => m.FilConversation),
      },
    ],
  },
];
