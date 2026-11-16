import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, effect, ElementRef, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { EtatConversations } from '../etat-conversations';
import { ListeConversations } from '../liste-conversations/liste-conversations';
import { MembresBloques } from '../membres-bloques/membres-bloques';
import { NouvelleConversation } from '../nouvelle-conversation/nouvelle-conversation';

/**
 * Cadre de la messagerie : la liste des conversations à gauche, le fil ouvert à droite.
 * Sur un petit écran, une seule colonne à la fois : la liste, ou le fil quand une conversation est ouverte.
 */
@Component({
  selector: 'app-page-messagerie',
  imports: [RouterOutlet, ListeConversations, NouvelleConversation, MembresBloques],
  providers: [EtatConversations],
  templateUrl: './page-messagerie.html',
  styleUrl: './page-messagerie.scss',
})
export class PageMessagerie {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly nouvelleOuverte = signal(false);
  protected readonly bloquesOuverts = signal(false);

  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects),
  ), { initialValue: this.router.url });
  protected readonly filOuvert = computed(() => /^\/messagerie\/[^/?#]+/.test(this.urlCourante()));

  constructor() {
    // Le fil se ferme (groupe quitté ou supprimé, conversation retirée) en emportant l’élément focalisé :
    // le focus revient au titre de la messagerie plutôt que de se perdre au début de la page.
    let filEtaitOuvert = this.filOuvert();
    effect(() => {
      const ouvert = this.filOuvert();
      if (filEtaitOuvert && !ouvert) {
        afterNextRender(() => {
          const actif = this.document.activeElement;
          if (!actif || actif === this.document.body || !actif.isConnected) {
            this.hote.nativeElement.querySelector<HTMLElement>('#titre-messagerie')?.focus();
          }
        }, { injector: this.injector });
      }
      filEtaitOuvert = ouvert;
    });
  }
}
