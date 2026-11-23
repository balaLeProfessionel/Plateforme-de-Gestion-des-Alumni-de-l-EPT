import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { FluxMobilites } from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { PageAdmin } from '../page-admin/page-admin';

/**
 * Flux de mobilité d’une année universitaire : mobilités prévues, en cours ou terminées par établissement et par
 * sens. Chaque nombre mène à la liste correspondante du suivi.
 */
@Component({
  selector: 'app-flux-mobilites',
  imports: [RouterLink, PageAdmin],
  templateUrl: './flux-mobilites.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './flux-mobilites.scss'],
})
export class FluxMobilitesPage {
  private readonly service = inject(OffresMobiliteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly flux = signal<FluxMobilites | null>(null);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap.pipe(
      map((p) => p.get('annee') ?? ''),
      switchMap((annee) => this.service.flux(annee).pipe(catchError((e: HttpErrorResponse) => {
        this.erreur.set(e.error?.message ?? 'Impossible de charger les flux.');
        return of(null);
      }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((flux) => this.flux.set(flux));
  }

  protected choisirAnnee(evenement: Event): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { annee: (evenement.target as HTMLSelectElement).value || null } });
  }
}
