import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { catchError, debounceTime, filter, map, of, Subject, switchMap, tap, timer } from 'rxjs';
import { FluxMessagerie } from '../../core/services/messagerie/flux-messagerie';
import { MessagerieService } from '../../core/services/messagerie/messagerie';
import { CommunauteADecouvrir, Conversation } from '../../core/services/models/messagerie.model';
import { INTERVALLE_LISTE_CONVERSATIONS } from './etat-conversations';
import { messageServeur } from './message-erreur';

/**
 * Communautés de la personne connectée (promo, filière, puis celles qu’elle a rejointes) et communautés ouvertes
 * qu’elle peut rejoindre. Le serveur la range dans celles de sa promo et de sa filière à chaque lecture.
 * Fourni par la page de la messagerie, comme `EtatConversations` : l’onglet affiche ses non-lus dès l’ouverture.
 */
@Injectable()
export class EtatCommunautes {
  private readonly messagerie = inject(MessagerieService);
  private readonly document = inject(DOCUMENT);
  private readonly flux = inject(FluxMessagerie);
  private readonly demandes = new Subject<void>();

  private readonly miennesSignal = signal<Conversation[]>([]);
  private readonly aDecouvrirSignal = signal<CommunauteADecouvrir[]>([]);
  private readonly chargementSignal = signal(true);
  private readonly chargeeSignal = signal(false);
  private readonly erreurSignal = signal<string | null>(null);
  readonly miennes = this.miennesSignal.asReadonly();
  readonly aDecouvrir = this.aDecouvrirSignal.asReadonly();
  readonly chargement = this.chargementSignal.asReadonly();
  readonly chargee = this.chargeeSignal.asReadonly();
  readonly erreur = this.erreurSignal.asReadonly();
  /** Messages non lus de toutes mes communautés, pour la pastille de l’onglet. */
  readonly nonLus = computed(() => this.miennesSignal().reduce((total, ligne) => total + ligne.nombreNonLus, 0));

  constructor() {
    const abonnement = this.demandes.pipe(
      switchMap(() => {
        this.chargementSignal.set(true);
        return this.messagerie.listerCommunautes().pipe(
          map((communautes) => ({ communautes, erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({
            communautes: null,
            erreur: messageServeur(erreur, 'Impossible de charger les communautés. Vérifiez votre connexion.'),
          })));
      }),
    ).subscribe(({ communautes, erreur }) => {
      if (communautes) {
        this.miennesSignal.set(communautes.miennes);
        this.aDecouvrirSignal.set(communautes.aDecouvrir);
        this.chargeeSignal.set(true);
      }
      this.erreurSignal.set(communautes || this.chargeeSignal() ? null : erreur);
      this.chargementSignal.set(false);
    });
    const signaux = this.flux.evenements.pipe(debounceTime(300)).subscribe(() => this.actualiser());
    const releve = timer(INTERVALLE_LISTE_CONVERSATIONS, INTERVALLE_LISTE_CONVERSATIONS)
      .pipe(filter(() => !this.flux.connecte() && this.document.visibilityState !== 'hidden'))
      .subscribe(() => this.actualiser());
    inject(DestroyRef).onDestroy(() => {
      abonnement.unsubscribe();
      signaux.unsubscribe();
      releve.unsubscribe();
    });
    this.actualiser();
  }

  actualiser(): void {
    this.demandes.next();
  }

  estMienne(id: string): boolean {
    return this.miennesSignal().some((communaute) => communaute.id === id);
  }

  /** Rejoint une communauté ouverte ; la liste se relit ensuite (elle passe dans « Mes communautés »). */
  rejoindre(id: string) {
    return this.messagerie.rejoindreCommunaute(id).pipe(tap(() => this.actualiser()));
  }

  /** La communauté vient d’être lue : sa pastille disparaît tout de suite. */
  marquerLue(id: string): void {
    this.miennesSignal.update((liste) =>
      liste.map((communaute) => communaute.id === id ? { ...communaute, nombreNonLus: 0 } : communaute));
  }
}
