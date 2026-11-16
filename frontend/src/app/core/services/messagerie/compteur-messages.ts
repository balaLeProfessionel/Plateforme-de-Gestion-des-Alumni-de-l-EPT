import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import { catchError, debounceTime, EMPTY, filter, merge, Subscription, switchMap, timer } from 'rxjs';
import { FluxMessagerie } from './flux-messagerie';
import { MessagerieService } from './messagerie';

/** Relève de secours du badge quand le flux temps réel est coupé : un simple comptage côté serveur. */
export const INTERVALLE_COMPTEUR_MESSAGES = 60_000;

/** Nombre de messages non lus, partagé par la navigation et la messagerie. */
@Service()
export class CompteurMessages {
  private readonly messagerie = inject(MessagerieService);
  private readonly document = inject(DOCUMENT);
  private readonly flux = inject(FluxMessagerie);
  private readonly nombreSignal = signal(0);
  private releve?: Subscription;
  readonly nombre = this.nombreSignal.asReadonly();

  actualiser(): void {
    this.messagerie.compterNonLus().pipe(catchError(() => EMPTY))
      .subscribe(({ nombre }) => this.nombreSignal.set(nombre));
  }

  /**
   * Ouvre le flux temps réel et recompte à chaque signal. La relève périodique ne sert plus
   * que de secours, quand le flux est coupé ; rien n’est demandé tant que l’onglet est caché.
   */
  demarrer(): void {
    if (this.releve) return;
    this.flux.demarrer();
    const signaux = this.flux.evenements.pipe(debounceTime(300));
    const secours = timer(INTERVALLE_COMPTEUR_MESSAGES, INTERVALLE_COMPTEUR_MESSAGES).pipe(
      filter(() => !this.flux.connecte() && this.document.visibilityState !== 'hidden'));
    this.releve = merge(timer(0), signaux, secours).pipe(
      switchMap(() => this.messagerie.compterNonLus().pipe(catchError(() => EMPTY))),
    ).subscribe(({ nombre }) => this.nombreSignal.set(nombre));
  }

  arreter(): void {
    this.releve?.unsubscribe();
    this.releve = undefined;
    this.flux.arreter();
  }
}
