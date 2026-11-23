import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  Convention, CriteresConventions, LIBELLES_STATUT_CONVENTION, STATUTS_CONVENTION, StatutConvention,
} from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { StatutConventionPastille } from '../../partenariats/statut-convention/statut-convention';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

/**
 * Conventions de partenariat pour le service des Relations extérieures : critères dans l’URL, recherche appliquée
 * après 300 ms (Entrée l’applique tout de suite), raccourci vers les conventions qui arrivent à expiration.
 */
@Component({
  selector: 'app-conventions-partenariat',
  imports: [DatePipe, RouterLink, PageAdmin, PaginationAdmin, StatutConventionPastille],
  templateUrl: './conventions-partenariat.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', '../offres-stage/offres-stage.scss', './conventions-partenariat.scss'],
})
export class ConventionsPartenariat {
  private readonly service = inject(ConventionsPartenariatService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  protected readonly statuts = LIBELLES_STATUT_CONVENTION;
  protected readonly listeStatuts = STATUTS_CONVENTION;
  protected readonly criteres = signal<CriteresConventions>({ statut: '', recherche: '', expireBientot: false, page: 0 });
  protected readonly page = signal<Page<Convention> | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
    this.route.queryParamMap.pipe(
      map((p): CriteresConventions => ({
        statut: (STATUTS_CONVENTION.includes(p.get('statut') as StatutConvention) ? p.get('statut') : '') as StatutConvention | '',
        recherche: (p.get('recherche') ?? '').slice(0, 100),
        expireBientot: p.get('expireBientot') === 'true',
        page: Math.max(0, Number(p.get('page')) || 0),
      })),
      tap((criteres) => {
        this.criteres.set(criteres);
        this.chargement.set(true);
        this.erreur.set(null);
      }),
      switchMap((criteres) => this.service.lister(criteres).pipe(catchError((e: HttpErrorResponse) => {
        this.erreur.set(e.error?.message ?? 'Impossible de charger les conventions.');
        return of(null);
      }))),
      takeUntilDestroyed(),
    ).subscribe((page) => {
      this.page.set(page);
      this.chargement.set(false);
    });
  }

  protected choisirStatut(evenement: Event): void {
    this.naviguer({ statut: (evenement.target as HTMLSelectElement).value || null, expireBientot: null });
  }

  protected basculerEcheance(): void {
    this.naviguer({ expireBientot: this.criteres().expireBientot ? null : true, statut: null });
  }

  protected saisir(evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value;
    clearTimeout(this.minuterie);
    this.minuterie = setTimeout(() => this.naviguer({ recherche: valeur.trim() || null }), 300);
  }

  protected appliquer(evenement: Event): void {
    evenement.preventDefault();
    clearTimeout(this.minuterie);
    this.naviguer({ recherche: (evenement.target as HTMLInputElement).value.trim() || null });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  private naviguer(params: Record<string, string | boolean | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { ...params, page: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
