import { DOCUMENT, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement } from '../../../core/services/models/evenement';

@Component({
  selector: 'app-detail-evenement',
  imports: [],
  templateUrl: './detail-evenement.html',
  styleUrl: './detail-evenement.scss',
})
export class DetailEvenement {
  private readonly evenementService = inject(EvenementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actualiserSujet = new Subject<void>();

  protected readonly evenement = signal<Evenement | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);

  constructor() {
    combineLatest([
      this.route.paramMap,
      this.actualiserSujet.pipe(startWith(undefined))
    ]).pipe(
      tap(() => {
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap(([params]) => this.evenementService.obtenir(params.get('id') ?? '').pipe(
        map((evenement) => ({ evenement, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          evenement: null,
          erreur: erreur.status === 404
            ? 'Cet événement n’est pas disponible.'
            : 'Impossible de charger cet événement.'
        }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ evenement, erreur }) => {
      this.evenement.set(evenement);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });
  }

  protected actualiser(): void {
    this.actualiserSujet.next();
  }

  protected retourner(): void {
    const navigationId = (this.document.defaultView?.history.state as { navigationId?: number } | undefined)
      ?.navigationId;
    if ((navigationId ?? 0) > 1) {
      this.location.back();
      return;
    }
    const params = this.route.snapshot.queryParamMap;
    const periode = params.get('periode') === 'PASSES' ? 'PASSES' : 'AVENIR';
    const page = Number(params.get('page'));
    void this.router.navigate(['/evenements'], {
      queryParams: { periode, page: Number.isSafeInteger(page) && page >= 0 ? page : 0 }
    });
  }

  protected formaterDate(date: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'full', timeStyle: 'short', timeZone: 'Africa/Dakar'
    }).format(new Date(date));
  }

  protected libelleAudience(audience: Evenement['audience']): string {
    return ({ ETUDIANTS: 'Étudiants', ALUMNI: 'Alumni', TOUS: 'Tous les membres' })[audience];
  }

  protected organisateur(evenement: Evenement): string {
    return [evenement.organisateurPrenom, evenement.organisateurNom].filter(Boolean).join(' ')
      || 'Membre EPT';
  }

  protected placesRestantes(evenement: Evenement): number | null {
    return evenement.nombrePlaces === null
      ? null
      : Math.max(0, evenement.nombrePlaces - evenement.nombreParticipants);
  }
}
