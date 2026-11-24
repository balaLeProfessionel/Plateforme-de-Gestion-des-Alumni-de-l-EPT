import { inject } from '@angular/core';
import { Routes, Router } from '@angular/router';
import {
  authGuard,
  changementInitialRequisGuard, accueilAdministrationGuard,
  changementInitialSeulementGuard,
  roleGuard,
  visiteurGuard,
  visiteurMatch
} from './core/guards/auth.guard';
import { AuthService } from './core/services/auth/auth-service';
import { titreProfil } from './features/profil/consultation-profil/titre-profil';

// Rubriques de l'en-tête public dont le module n'est pas encore livré (voir `RUBRIQUES_A_VENIR`).
const RUBRIQUES_ROUTES = [
  ['messagerie', 'Messagerie et espace communautaire'],
  ['partenariats', 'Partenariats de l’école'],
  ['conventions', 'Conventions'],
  ['insertion', 'Insertion professionnelle'],
  ['offres-emploi', 'Offres d’emploi'],
  ['publier-offre', 'Publier une offre']
] as const;

export const routes: Routes = [
  {
    // Page publique d'accueil ; placée avant le cadre de l'espace membre, qui partage le chemin vide.
    path: '',
    pathMatch: 'full',
    title: 'EPT Alumni | Le réseau des diplômés de l’EPT',
    canActivate: [visiteurGuard],
    loadComponent: () =>
      import('./features/vitrine/page-vitrine/page-vitrine').then((m) => m.PageVitrine)
  },
  {
    path: 'recherche',
    title: 'EPT Alumni | Recherche',
    canActivate: [visiteurGuard],
    loadComponent: () => import('./features/vitrine/recherche-site/recherche-site').then((m) => m.RechercheSite)
  },
  {
    path: 'annuaire-diplomes',
    title: 'EPT Alumni | Annuaire des diplômés',
    canActivate: [visiteurGuard],
    loadComponent: () =>
      import('./features/vitrine/recherche-diplomes/recherche-diplomes').then((m) => m.RechercheDiplomes)
  },
  ...RUBRIQUES_ROUTES.map(([path, titre]) => ({
    path,
    title: `EPT Alumni | ${titre}`,
    data: { rubrique: path },
    // La messagerie existe dans l’espace membre : connecté, on passe à la route suivante au lieu de l’accueil.
    canMatch: path === 'messagerie' ? [() => !inject(AuthService).estConnecte()] : [],
    // Connecté, /partenariats mène à la rubrique de l'organisme (conventions-cadres) : la page d'attente ne vaut que sans compte.
    ...(path === 'partenariats' ? { canMatch: [visiteurMatch] } : {}),
    canActivate: [visiteurGuard],
    loadComponent: () => import('./features/vitrine/page-bientot/page-bientot').then((m) => m.PageBientot)
  })),
  {
    // Sans compte : la rubrique invite à se connecter. Connecté, la route des membres (offres de mobilité) prend le relais.
    path: 'mobilites',
    title: 'EPT Alumni | Mobilités',
    canMatch: [visiteurMatch],
    loadComponent: () => import('./features/vitrine/page-mobilites/page-mobilites').then((m) => m.PageMobilites)
  },
  {
    // Sans compte : la rubrique invite à se connecter (STA-02). Connecté, la route des membres prend le relais.
    path: 'stages',
    title: 'EPT Alumni | Stages',
    canMatch: [visiteurMatch],
    loadComponent: () => import('./features/vitrine/page-stages/page-stages').then((m) => m.PageStages)
  },
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
    title: 'Définir votre mot de passe | EPT Alumni',
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
        path: 'publications/nouvelle',
        title: 'Nouvelle publication | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/publications/creation-publication/creation-publication').then((m) => m.CreationPublication)
      },
      {
        path: 'publications/:id',
        title: 'Publication | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/publications/detail-publication/detail-publication').then((m) => m.DetailPublication)
      },
      {
        path: 'articles',
        title: 'Articles | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/articles/bibliotheque-articles/bibliotheque-articles').then((m) => m.BibliothequeArticles)
      },
      {
        path: 'articles/nouveau',
        title: 'Nouvel article | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/articles/edition-article/edition-article').then((m) => m.EditionArticle)
      },
      {
        path: 'articles/:id/modifier',
        title: 'Modifier un article | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/articles/edition-article/edition-article').then((m) => m.EditionArticle)
      },
      {
        path: 'articles/:id',
        title: 'Article | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/articles/lecture-article/lecture-article').then((m) => m.LectureArticle)
      },
      {
        path: 'notifications',
        title: 'Notifications | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadComponent: () =>
          import('./features/notifications/page-notifications/page-notifications').then((m) => m.PageNotifications)
      },
      {
        path: 'messagerie',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadChildren: () => import('./features/messagerie/messagerie.routes').then((m) => m.MESSAGERIE_ROUTES)
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
        title: 'Nouvel événement | EPT Alumni',
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
        path: 'stages',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadChildren: () => import('./features/stages/stages.routes').then((m) => m.STAGES_ROUTES)
      },
      {
        path: 'mobilites',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadChildren: () => import('./features/mobilites/mobilites.routes').then((m) => m.MOBILITES_ROUTES)
      },
      {
        path: 'partenaires',
        title: 'Partenaires de l’EPT | EPT Alumni',
        canActivate: [authGuard, changementInitialRequisGuard, roleGuard],
        data: { roles: ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'ADMIN'] },
        loadComponent: () => import('./features/partenaires/liste-partenaires/liste-partenaires').then((m) => m.ListePartenaires)
      },
      {
        path: 'partenariats',
        canActivate: [authGuard, changementInitialRequisGuard],
        loadChildren: () => import('./features/partenariats/partenariats.routes').then((m) => m.PARTENARIATS_ROUTES)
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
