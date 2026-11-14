import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { EtatConversations } from '../etat-conversations';
import { ListeConversations } from '../liste-conversations/liste-conversations';
import { NouvelleConversation } from '../nouvelle-conversation/nouvelle-conversation';

/**
 * Cadre de la messagerie : la liste des conversations à gauche, le fil ouvert à droite.
 * Sur un petit écran, une seule colonne à la fois : la liste, ou le fil quand une conversation est ouverte.
 */
@Component({
  selector: 'app-page-messagerie',
  imports: [RouterOutlet, ListeConversations, NouvelleConversation],
  providers: [EtatConversations],
  templateUrl: './page-messagerie.html',
  styleUrl: './page-messagerie.scss',
})
export class PageMessagerie {
  private readonly router = inject(Router);
  protected readonly nouvelleOuverte = signal(false);

  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects),
  ), { initialValue: this.router.url });
  protected readonly filOuvert = computed(() => /^\/messagerie\/[^/?#]+/.test(this.urlCourante()));
}
