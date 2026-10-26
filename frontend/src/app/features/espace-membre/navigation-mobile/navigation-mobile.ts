import { Component, computed, inject, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';

/** Barre de navigation fixée en bas des petits écrans, avec le bouton qui ouvre « Mon espace ». */
@Component({
  selector: 'app-navigation-mobile',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation-mobile.html',
  styleUrl: './navigation-mobile.scss',
})
export class NavigationMobile {
  readonly menuOuvert = model(false);

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly demandesEnAttente = inject(CompteurDemandesMentorat).nombre;
  private readonly inscriptionsEnAttente = inject(CompteurInscriptions).nombre;
  /** L’accueil de l’administration est son tableau de bord : on y va directement, sans redirection. */
  private readonly administration = computed(() => this.authService.aPermission('CONSULTER_TABLEAU_DE_BORD'));
  protected readonly lienAccueil = computed(() => this.administration() ? '/admin' : '/accueil');
  /** Ce qui attend dans « Menu » : les inscriptions pour l’administration, les demandes de mentorat sinon. */
  protected readonly pastille = computed(() => this.administration()
    ? { nombre: this.inscriptionsEnAttente(), libelle: 'inscriptions à examiner' }
    : { nombre: this.demandesEnAttente(), libelle: 'demandes de mentorat en attente' });
  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects)
  ), { initialValue: this.router.url });

  /** Les pages sans onglet propre (compte, mentorat) : le bouton Menu les signale comme page courante. */
  protected readonly pageDuMenu = computed(() =>
    /^\/(profil|organisme|completer-profil|completer-organisme|mentorat)(\/|\?|#|$)/.test(this.urlCourante())
    // Les rubriques d’administration sont dans « Menu », sauf le tableau de bord, qui est l’accueil.
    || /^\/admin\//.test(this.urlCourante())
  );

  protected basculerMenu(): void {
    this.menuOuvert.update((ouvert) => !ouvert);
  }

  protected fermerMenu(): void {
    this.menuOuvert.set(false);
  }
}
