import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, effect, ElementRef, inject, Injector, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { EtatCommunautes } from '../etat-communautes';
import { EtatConversations } from '../etat-conversations';
import { ListeCommunautes } from '../liste-communautes/liste-communautes';
import { ListeConversations } from '../liste-conversations/liste-conversations';
import { MembresBloques } from '../membres-bloques/membres-bloques';
import { NouvelleConversation } from '../nouvelle-conversation/nouvelle-conversation';

/**
 * Cadre de la messagerie : la liste des conversations à gauche, le fil ouvert à droite.
 * Sur un petit écran, une seule colonne à la fois : la liste, ou le fil quand une conversation est ouverte.
 */
@Component({
  selector: 'app-page-messagerie',
  imports: [RouterOutlet, ListeConversations, ListeCommunautes, NouvelleConversation, MembresBloques],
  providers: [EtatConversations, EtatCommunautes],
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
  protected readonly communautes = inject(EtatCommunautes);
  /** Colonne de gauche : mes conversations, ou les communautés (promo, filière, celles que j’ai rejointes). */
  protected readonly onglet = signal<'conversations' | 'communautes'>('conversations');

  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects),
  ), { initialValue: this.router.url });
  protected readonly filOuvert = computed(() => /^\/messagerie\/[^/?#]+/.test(this.urlCourante()));
  private readonly idOuvert = computed(() => /^\/messagerie\/([^/?#]+)/.exec(this.urlCourante())?.[1] ?? null);

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

    // Une communauté ouverte par un lien direct : l’onglet « Communautés » s’affiche, une fois les communautés lues.
    let ongletChoisi = false;
    effect(() => {
      const id = this.idOuvert();
      if (ongletChoisi || !this.communautes.chargee()) return;
      ongletChoisi = true;
      if (id && this.communautes.estMienne(id)) this.onglet.set('communautes');
    });
  }

  /** Flèches gauche et droite (et Début, Fin) d’un onglet à l’autre, comme le veut le motif « tablist ». */
  protected naviguerOnglets(evenement: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(evenement.key)) return;
    evenement.preventDefault();
    const suivant = evenement.key === 'Home' ? 'conversations' : evenement.key === 'End' ? 'communautes'
      : this.onglet() === 'conversations' ? 'communautes' : 'conversations';
    this.onglet.set(suivant);
    this.hote.nativeElement.querySelector<HTMLElement>(`#onglet-${suivant}`)?.focus();
  }
}
