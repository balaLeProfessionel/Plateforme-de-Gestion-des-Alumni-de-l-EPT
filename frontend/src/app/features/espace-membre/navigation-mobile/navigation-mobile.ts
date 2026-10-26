import { Component, computed, inject, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
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
  protected readonly demandesEnAttente = inject(CompteurDemandesMentorat).nombre;
  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects)
  ), { initialValue: this.router.url });

  /** Les pages sans onglet propre (compte, mentorat) : le bouton Menu les signale comme page courante. */
  protected readonly pageDuMenu = computed(() =>
    /^\/(profil|organisme|completer-profil|completer-organisme|mentorat|admin)(\/|\?|#|$)/.test(this.urlCourante())
  );

  protected basculerMenu(): void {
    this.menuOuvert.update((ouvert) => !ouvert);
  }

  protected fermerMenu(): void {
    this.menuOuvert.set(false);
  }
}
