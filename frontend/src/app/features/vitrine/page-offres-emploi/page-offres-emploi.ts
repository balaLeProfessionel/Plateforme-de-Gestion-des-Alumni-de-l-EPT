import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EnteteVitrine } from '../entete-vitrine/entete-vitrine';
import { PiedVitrine } from '../pied-vitrine/pied-vitrine';

/** Rubrique « Offres d’emploi » sans compte : les offres sont réservées aux membres connectés. */
@Component({
  selector: 'app-page-offres-emploi',
  imports: [RouterLink, EnteteVitrine, PiedVitrine],
  template: `
    <app-entete-vitrine />
    <main id="contenu" tabindex="-1">
      <div class="contenu">
        <h1>Offres d’emploi</h1>
        <p>Les membres y relaient les offres qu’ils repèrent, et les organismes partenaires y publient les leurs, vérifiées par l’école : on postule alors directement sur la plateforme.</p>
        <p>Les offres sont réservées aux membres de la plateforme : connectez-vous pour les consulter.</p>
        <h2 id="publier">Publier une offre</h2>
        <p>Un membre connecté peut relayer une offre. Un organisme partenaire la publie depuis son compte et reçoit les candidatures.</p>
        <div class="actions">
          <a class="bouton bouton-principal" routerLink="/connexion">Se connecter</a>
          <a class="bouton bouton-secondaire" routerLink="/inscription">Créer un compte</a>
        </div>
      </div>
    </main>
    <app-pied-vitrine />
  `,
  styleUrl: '../page-bientot/page-bientot.scss',
})
export class PageOffresEmploi {}
