import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { catchError, EMPTY, filter, Subscription, switchMap, tap, timer } from 'rxjs';
import { PageNotifications } from '../models/notification.model';

/** Intervalle de relève de la pastille : léger, un simple comptage côté serveur. */
export const INTERVALLE_NOTIFICATIONS = 60_000;

/** Notifications du membre connecté et compteur de non lues partagé par les cloches. */
@Service()
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly nonLuesSignal = signal(0);
  private releve?: Subscription;
  readonly nonLues = this.nonLuesSignal.asReadonly();

  lister(page: number, taille = 10, nonLuesSeulement = false) {
    let params = new HttpParams().set('page', page).set('taille', taille);
    if (nonLuesSeulement) params = params.set('nonLues', true);
    return this.http.get<PageNotifications>('/api/notifications', { params })
      .pipe(tap(({ nonLues }) => this.nonLuesSignal.set(nonLues)));
  }

  marquerLue(id: string) {
    return this.http.post<void>(`/api/notifications/${encodeURIComponent(id)}/lue`, null)
      .pipe(tap(() => this.nonLuesSignal.update((nombre) => Math.max(0, nombre - 1))));
  }

  toutMarquerLu() {
    return this.http.post<void>('/api/notifications/lues', null).pipe(tap(() => this.nonLuesSignal.set(0)));
  }

  /** Relève immédiate puis régulière ; rien n’est demandé tant que l’onglet est caché. */
  demarrer(): void {
    if (this.releve) return;
    this.releve = timer(0, INTERVALLE_NOTIFICATIONS).pipe(
      filter(() => this.document.visibilityState !== 'hidden'),
      switchMap(() => this.http.get<{ nombre: number }>('/api/notifications/non-lues').pipe(catchError(() => EMPTY))),
    ).subscribe(({ nombre }) => this.nonLuesSignal.set(nombre));
  }

  arreter(): void {
    this.releve?.unsubscribe();
    this.releve = undefined;
  }
}
