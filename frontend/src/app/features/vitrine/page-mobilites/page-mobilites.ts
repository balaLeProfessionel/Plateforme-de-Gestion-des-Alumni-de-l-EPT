import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EnteteVitrine } from '../entete-vitrine/entete-vitrine';
import { PiedVitrine } from '../pied-vitrine/pied-vitrine';

/** Rubrique « Mobilités » sans compte : les offres et les candidatures sont réservées aux membres connectés. */
@Component({
  selector: 'app-page-mobilites',
  imports: [RouterLink, EnteteVitrine, PiedVitrine],
  template: `
    <app-entete-vitrine />
    <main id="contenu" tabindex="-1">
      <div class="contenu">
        <h1>Mobilités</h1>
        <p>Les établissements partenaires de l’EPT y proposent des échanges, des doubles diplômes et des séjours d’enseignement.</p>
        <p>Les offres sont réservées aux membres de la plateforme : connectez-vous pour les consulter. Les étudiants et les enseignants de l’EPT candidatent en ligne.</p>
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
export class PageMobilites {}
