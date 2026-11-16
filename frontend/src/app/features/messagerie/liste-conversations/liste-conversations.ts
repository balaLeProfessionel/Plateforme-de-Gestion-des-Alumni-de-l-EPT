import { afterNextRender, Component, computed, effect, ElementRef, inject, Injector, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { debounceTime, map } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { DateRelativePipe } from '../../../shared/dates/date-relative';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { apercuConversation } from '../apercu';
import { EtatConversations } from '../etat-conversations';

/** Longueur maximale d’une recherche (même limite que l’API). */
export const LONGUEUR_MAX_RECHERCHE_CONVERSATIONS = 100;

/**
 * Colonne des conversations, la plus récente en premier, avec ses quatre états, une recherche par nom
 * et « Afficher plus » pour les conversations au-delà de la première page.
 */
@Component({
  selector: 'app-liste-conversations',
  imports: [FormField, RouterLink, RouterLinkActive, AvatarMembre, DateRelativePipe],
  templateUrl: './liste-conversations.html',
  styleUrl: './liste-conversations.scss',
})
export class ListeConversations {
  protected readonly etat = inject(EtatConversations);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly moiId = computed(() => this.authService.utilisateur()?.id);
  readonly nouvelle = output<void>();

  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.recherche, LONGUEUR_MAX_RECHERCHE_CONVERSATIONS);
  });
  /** Index de la première conversation ajoutée par « Afficher plus » : elle recevra le focus. */
  private premiereAjoutee: number | null = null;

  protected readonly lignes = computed(() => {
    const moi = this.moiId();
    return this.etat.conversations().map((conversation) => ({
      conversation,
      apercu: apercuConversation(conversation, moi),
      nonLus: conversation.nombreNonLus > 99 ? '99+' : String(conversation.nombreNonLus),
    }));
  });
  /**
   * La recherche reste affichée tant qu’il y a des conversations, qu’une recherche est en cours ou que la liste se
   * recharge (sinon, effacer une recherche sans résultat ferait disparaître le champ, et le focus avec lui).
   */
  protected readonly rechercheVisible = computed(() => this.etat.chargee()
    && (this.lignes().length > 0 || this.etat.recherche().trim() !== '' || this.etat.chargement()));
  /** Résultat annoncé aux lecteurs d’écran après chaque recherche. */
  protected readonly statutRecherche = computed(() => {
    const recherche = this.etat.recherche().trim();
    if (!recherche || this.etat.chargement()) return '';
    const total = this.etat.total();
    return total === 0 ? 'Aucune conversation trouvée.'
      : `${total} conversation${total > 1 ? 's' : ''} trouvée${total > 1 ? 's' : ''}.`;
  });

  constructor() {
    toObservable(this.modele).pipe(
      map(({ recherche }) => recherche.slice(0, LONGUEUR_MAX_RECHERCHE_CONVERSATIONS)),
      debounceTime(300),
      takeUntilDestroyed(),
    ).subscribe((recherche) => this.etat.rechercher(recherche));

    // Les conversations ajoutées sont arrivées : le focus va à la première d’entre elles.
    effect(() => {
      const nombre = this.lignes().length;
      const indice = this.premiereAjoutee;
      if (indice === null || nombre <= indice) return;
      this.premiereAjoutee = null;
      afterNextRender(() => this.hote.nativeElement.querySelectorAll<HTMLElement>('.conversations a')[indice]?.focus(),
        { injector: this.injector });
    });
  }

  protected afficherPlus(): void {
    this.premiereAjoutee = this.lignes().length;
    this.etat.afficherPlus();
  }

  protected effacerRecherche(): void {
    this.modele.set({ recherche: '' });
    this.hote.nativeElement.querySelector<HTMLInputElement>('#recherche-conversations')?.focus();
  }
}
