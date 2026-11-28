import { Component, computed, inject, model } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { CompteurMessages } from '../../../core/services/messagerie/compteur-messages';

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
  private readonly messagesNonLus = inject(CompteurMessages).nombre;
  /** L’accueil de l’administration est son tableau de bord : on y va directement, sans redirection. */
  private readonly administration = computed(() => this.authService.aPermission('CONSULTER_TABLEAU_DE_BORD'));
  protected readonly lienAccueil = computed(() => this.administration() ? '/admin' : '/accueil');
  /**
   * Ce qui attend dans « Menu » : les inscriptions pour l’administration ; pour un membre, les messages
   * non lus et les demandes de mentorat, additionnés dans la pastille et détaillés pour les lecteurs d’écran.
   */
  protected readonly pastille = computed(() => {
    if (this.administration()) {
      const nombre = this.inscriptionsEnAttente();
      return { nombre, texte: `${nombre} inscriptions à examiner` };
    }
    const messages = this.messagesNonLus();
    const demandes = this.demandesEnAttente();
    const details = [
      ...(messages > 0 ? [`${messages} ${messages > 1 ? 'messages non lus' : 'message non lu'}`] : []),
      ...(demandes > 0 ? [`${demandes} demandes de mentorat en attente`] : []),
    ];
    return { nombre: messages + demandes, texte: details.join(' et ') };
  });
  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects)
  ), { initialValue: this.router.url });

  /** Les pages sans onglet propre (compte, mentorat) : le bouton Menu les signale comme page courante. */
  protected readonly pageDuMenu = computed(() =>
    /^\/(profil|organisme|completer-profil|completer-organisme|mentorat|articles|messagerie|offres-emploi)(\/|\?|#|$)/.test(this.urlCourante())
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
