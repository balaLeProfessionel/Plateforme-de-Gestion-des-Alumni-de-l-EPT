import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { catchError, debounceTime, filter, map, of, Subject, switchMap, timer } from 'rxjs';
import { CompteurMessages } from '../../core/services/messagerie/compteur-messages';
import { FluxMessagerie } from '../../core/services/messagerie/flux-messagerie';
import { MessagerieService } from '../../core/services/messagerie/messagerie';
import { Conversation } from '../../core/services/models/messagerie.model';

/** Relève de secours de la liste quand le flux temps réel est coupé. */
export const INTERVALLE_LISTE_CONVERSATIONS = 30_000;

/**
 * Liste des conversations partagée par la colonne de gauche et le fil ouvert : un message envoyé
 * ou lu dans le fil met la liste et le badge à jour sans attendre la relève suivante.
 * Fourni par la page de la messagerie : il vit et s’arrête avec elle.
 */
@Injectable()
export class EtatConversations {
  private readonly messagerie = inject(MessagerieService);
  private readonly compteur = inject(CompteurMessages);
  private readonly document = inject(DOCUMENT);
  private readonly flux = inject(FluxMessagerie);
  private readonly demandes = new Subject<void>();

  private readonly conversationsSignal = signal<Conversation[]>([]);
  private readonly chargementSignal = signal(true);
  private readonly chargeeSignal = signal(false);
  private readonly erreurSignal = signal<string | null>(null);
  readonly conversations = this.conversationsSignal.asReadonly();
  readonly chargement = this.chargementSignal.asReadonly();
  /** Vrai dès la première réponse : distingue « pas encore chargée » de « vide ». */
  readonly chargee = this.chargeeSignal.asReadonly();
  readonly erreur = this.erreurSignal.asReadonly();

  constructor() {
    const abonnement = this.demandes.pipe(
      switchMap(() => {
        this.chargementSignal.set(true);
        return this.messagerie.listerConversations().pipe(
          map((page) => ({ conversations: page.contenu, erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({
            conversations: null,
            erreur: erreur.error?.message ?? 'Impossible de charger vos conversations. Vérifiez votre connexion.',
          })));
      }),
    ).subscribe(({ conversations, erreur }) => {
      if (conversations) {
        this.conversationsSignal.set(conversations);
        this.chargeeSignal.set(true);
      }
      // Une relève qui échoue garde la liste déjà affichée : l’erreur ne remplace qu’une liste jamais chargée.
      this.erreurSignal.set(conversations || this.chargeeSignal() ? null : erreur);
      this.chargementSignal.set(false);
    });
    // Le badge suit le flux de lui-même : seule la liste est rechargée ici.
    const signaux = this.flux.evenements.pipe(debounceTime(300)).subscribe(() => this.demandes.next());
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

  /** Recharge la liste et le badge de la navigation. */
  actualiser(): void {
    this.demandes.next();
    this.compteur.actualiser();
  }

  /** La conversation vient d’être lue : sa pastille disparaît tout de suite. */
  marquerLue(id: string): void {
    this.conversationsSignal.update((liste) =>
      liste.map((conversation) => conversation.id === id ? { ...conversation, nombreNonLus: 0 } : conversation));
  }
}
