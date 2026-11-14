import { DOCUMENT } from '@angular/common';
import { inject, Service, signal } from '@angular/core';
import { catchError, EMPTY, filter, Subscription, switchMap, timer } from 'rxjs';
import { MessagerieService } from './messagerie';

/** Relève du badge de la navigation : un simple comptage côté serveur. */
export const INTERVALLE_COMPTEUR_MESSAGES = 60_000;

/** Nombre de messages non lus, partagé par la navigation et la messagerie. */
@Service()
export class CompteurMessages {
  private readonly messagerie = inject(MessagerieService);
  private readonly document = inject(DOCUMENT);
  private readonly nombreSignal = signal(0);
  private releve?: Subscription;
  readonly nombre = this.nombreSignal.asReadonly();

  actualiser(): void {
    this.messagerie.compterNonLus().pipe(catchError(() => EMPTY))
      .subscribe(({ nombre }) => this.nombreSignal.set(nombre));
  }

  /** Relève immédiate puis régulière ; rien n’est demandé tant que l’onglet est caché. */
  demarrer(): void {
    if (this.releve) return;
    this.releve = timer(0, INTERVALLE_COMPTEUR_MESSAGES).pipe(
      filter(() => this.document.visibilityState !== 'hidden'),
      switchMap(() => this.messagerie.compterNonLus().pipe(catchError(() => EMPTY))),
    ).subscribe(({ nombre }) => this.nombreSignal.set(nombre));
  }

  arreter(): void {
    this.releve?.unsubscribe();
    this.releve = undefined;
  }
}
