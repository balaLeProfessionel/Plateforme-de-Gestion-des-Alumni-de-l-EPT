import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EnteteVitrine } from '../entete-vitrine/entete-vitrine';
import { PiedVitrine } from '../pied-vitrine/pied-vitrine';

/** Rubrique « Stages » sans compte : les offres sont réservées aux membres connectés (STA-02). */
@Component({
  selector: 'app-page-stages',
  imports: [RouterLink, EnteteVitrine, PiedVitrine],
  template: `
    <app-entete-vitrine />
    <main id="contenu" tabindex="-1">
      <div class="contenu">
        <h1>Stages</h1>
        <p>Les organismes partenaires y publient leurs offres de stage, vérifiées par l’école.</p>
        <p>Les offres sont réservées aux membres de la plateforme : connectez-vous pour les consulter. Seuls les étudiants de l’EPT peuvent postuler.</p>
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
export class PageStages {}
