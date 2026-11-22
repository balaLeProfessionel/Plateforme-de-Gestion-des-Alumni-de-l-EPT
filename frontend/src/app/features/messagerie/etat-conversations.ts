import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { catchError, debounceTime, filter, forkJoin, map, of, Subject, switchMap, timer } from 'rxjs';
import { CompteurMessages } from '../../core/services/messagerie/compteur-messages';
import { FluxMessagerie } from '../../core/services/messagerie/flux-messagerie';
import { MessagerieService } from '../../core/services/messagerie/messagerie';
import { Conversation } from '../../core/services/models/messagerie.model';
import { messageServeur } from './message-erreur';

/** Relève de secours de la liste quand le flux temps réel est coupé. */
export const INTERVALLE_LISTE_CONVERSATIONS = 30_000;
/** Conversations chargées à la fois ; « Afficher plus » ajoute une page. */
export const TAILLE_PAGE_CONVERSATIONS = 20;

/**
 * Liste des conversations partagée par la colonne de gauche et le fil ouvert : un message envoyé
 * ou lu dans le fil met la liste et le badge à jour sans attendre la relève suivante.
 * La liste se charge par pages ; une actualisation relit toutes les pages déjà affichées, pour qu’une
 * conversation remontée en tête ou quittée ne laisse ni doublon ni ligne périmée.
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
  private readonly rechercheSignal = signal('');
  private readonly pagesSignal = signal(1);
  private readonly totalPagesSignal = signal(0);
  private readonly totalSignal = signal(0);
  readonly conversations = this.conversationsSignal.asReadonly();
  readonly chargement = this.chargementSignal.asReadonly();
  /** Vrai dès la première réponse : distingue « pas encore chargée » de « vide ». */
  readonly chargee = this.chargeeSignal.asReadonly();
  readonly erreur = this.erreurSignal.asReadonly();
  /** Texte cherché dans le nom des conversations ; vide, toute la liste. */
  readonly recherche = this.rechercheSignal.asReadonly();
  /** Nombre de conversations correspondant à la recherche (toutes pages confondues). */
  readonly total = this.totalSignal.asReadonly();
  readonly aPlus = computed(() => this.pagesSignal() < this.totalPagesSignal());

  constructor() {
    const abonnement = this.demandes.pipe(
      switchMap(() => {
        this.chargementSignal.set(true);
        const recherche = this.rechercheSignal();
        const pages = Array.from({ length: this.pagesSignal() }, (_, page) =>
          this.messagerie.listerConversations(page, TAILLE_PAGE_CONVERSATIONS, recherche));
        return forkJoin(pages).pipe(
          map((resultats) => ({ resultats, erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({
            resultats: null,
            erreur: messageServeur(erreur, 'Impossible de charger vos conversations. Vérifiez votre connexion.'),
          })));
      }),
    ).subscribe(({ resultats, erreur }) => {
      if (resultats) {
        const vues = new Set<string>();
        // Entre deux pages lues au même moment, une conversation peut avoir changé de place : on ne la garde qu’une fois.
        this.conversationsSignal.set(resultats.flatMap((page) => page.contenu)
          .filter((conversation) => !vues.has(conversation.id) && !!vues.add(conversation.id)));
        const derniere = resultats[resultats.length - 1];
        this.totalPagesSignal.set(derniere.totalPages);
        this.totalSignal.set(derniere.totalElements);
        this.chargeeSignal.set(true);
      }
      // Une relève qui échoue garde la liste déjà affichée : l’erreur ne remplace qu’une liste jamais chargée.
      this.erreurSignal.set(resultats || this.chargeeSignal() ? null : erreur);
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

  /** Ajoute la page suivante de conversations. */
  afficherPlus(): void {
    if (!this.aPlus()) return;
    this.pagesSignal.update((pages) => pages + 1);
    this.demandes.next();
  }

  /** Nouvelle recherche : on repart de la première page. */
  rechercher(texte: string): void {
    if (texte.trim() === this.rechercheSignal().trim()) return;
    this.rechercheSignal.set(texte);
    this.pagesSignal.set(1);
    this.demandes.next();
  }

  /** La conversation vient d’être lue : sa pastille disparaît tout de suite. */
  marquerLue(id: string): void {
    this.conversationsSignal.update((liste) =>
      liste.map((conversation) => conversation.id === id ? { ...conversation, nombreNonLus: 0 } : conversation));
  }
}
