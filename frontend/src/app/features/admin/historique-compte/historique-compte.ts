import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { ActionAdmin, detailsLisibles, LIBELLES_ACTION_ADMIN } from '../../../core/services/models/admin.model';

/** Journal des décisions prises sur un compte : qui, quand, pourquoi. */
@Component({
  selector: 'app-historique-compte',
  imports: [DatePipe],
  template: `
    @if (erreur(); as message) {
      <p class="vide" role="alert">{{ message }}</p>
    } @else if (actions(); as liste) {
      @if (liste.length === 0) {
        <p class="vide">Aucune décision enregistrée pour ce compte.</p>
      } @else {
        <ol aria-label="Historique des décisions">
          @for (action of liste; track action.id) {
            <li>
              <strong>{{ libelles[action.type] }}@if (detailsLisibles(action.details); as details) { · {{ details }} }</strong>
              <span class="quand">le {{ action.dateAction | date: 'd MMM y, HH:mm' }} par {{ action.auteur }}</span>
              @if (action.motif) { <span class="pourquoi">{{ action.motif }}</span> }
            </li>
          }
        </ol>
      }
    } @else {
      <p class="vide" aria-busy="true">Chargement de l’historique…</p>
    }
  `,
  styles: `
    :host { display: block; padding: 0.75rem 0.9rem; border-radius: 8px; background: var(--ept-bg); font-size: 0.84rem; }
    ol { display: grid; gap: 0.55rem; margin: 0; padding: 0; list-style: none; }
    li { display: grid; gap: 0.1rem; padding-left: 0.75rem; border-left: 3px solid var(--ept-primary-light); }
    strong { color: var(--ept-primary-dark); }
    .quand, .vide { margin: 0; color: var(--ept-text-secondary); }
    .pourquoi { color: var(--ept-primary-dark); font-style: italic; overflow-wrap: anywhere; }
  `,
})
export class HistoriqueCompte {
  private readonly service = inject(AdminComptesService);
  readonly compteId = input.required<string>();
  /** Incrémenté par le parent après une décision : l’historique se recharge. */
  readonly actualisation = input(0);

  protected readonly libelles = LIBELLES_ACTION_ADMIN;
  protected readonly detailsLisibles = detailsLisibles;
  protected readonly actions = signal<ActionAdmin[] | null>(null);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    toObservable(computed(() => ({ id: this.compteId(), version: this.actualisation() }))).pipe(
      switchMap(({ id }) => this.service.historique(id).pipe(
        map((actions) => ({ actions, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          actions: null,
          erreur: erreur.error?.message ?? 'Impossible de charger l’historique.',
        })))),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe(({ actions, erreur }) => {
      this.actions.set(actions);
      this.erreur.set(erreur);
    });
  }
}
