import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  Accord, CriteresAccords, LIBELLES_STATUT_ACCORD, LIBELLES_TYPE_ACCORD, STATUTS_ACCORD, StatutAccord, TypeAccord,
} from '../../../core/services/models/partenariat.model';
import { AccordsService } from '../../../core/services/partenariats/accords';
import { StatutAccordPastille } from '../../partenariats/statut-accord/statut-accord';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

/**
 * Accords de stage et de mobilité pour le service des Relations extérieures : critères dans l’URL, recherche appliquée
 * après 300 ms (Entrée l’applique tout de suite), raccourci vers les propositions des organismes qui attendent une réponse.
 */
@Component({
  selector: 'app-accords-partenariat',
  imports: [DatePipe, RouterLink, PageAdmin, PaginationAdmin, StatutAccordPastille],
  templateUrl: './accords-partenariat.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', '../offres-stage/offres-stage.scss', '../conventions-partenariat/conventions-partenariat.scss'],
})
export class AccordsPartenariat {
  private readonly service = inject(AccordsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  protected readonly statuts = LIBELLES_STATUT_ACCORD;
  protected readonly listeStatuts = STATUTS_ACCORD;
  protected readonly types = LIBELLES_TYPE_ACCORD;
  protected readonly criteres = signal<CriteresAccords>({ type: '', statut: '', recherche: '', aRepondre: false, page: 0 });
  protected readonly page = signal<Page<Accord> | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
    this.route.queryParamMap.pipe(
      map((p): CriteresAccords => ({
        type: (['STAGE', 'MOBILITE'].includes(p.get('type') ?? '') ? p.get('type') : '') as TypeAccord | '',
        statut: (STATUTS_ACCORD.includes(p.get('statut') as StatutAccord) ? p.get('statut') : '') as StatutAccord | '',
        recherche: (p.get('recherche') ?? '').slice(0, 100),
        aRepondre: p.get('aRepondre') === 'true',
        page: Math.max(0, Number(p.get('page')) || 0),
      })),
      tap((criteres) => {
        this.criteres.set(criteres);
        this.chargement.set(true);
        this.erreur.set(null);
      }),
      switchMap((criteres) => this.service.lister(criteres).pipe(catchError((e: HttpErrorResponse) => {
        this.erreur.set(e.error?.message ?? 'Impossible de charger les accords.');
        return of(null);
      }))),
      takeUntilDestroyed(),
    ).subscribe((page) => {
      this.page.set(page);
      this.chargement.set(false);
    });
  }

  protected choisir(cle: 'type' | 'statut', evenement: Event): void {
    this.naviguer({ [cle]: (evenement.target as HTMLSelectElement).value || null, ...(cle === 'statut' ? { aRepondre: null } : {}) });
  }

  protected basculerReponse(): void {
    this.naviguer({ aRepondre: this.criteres().aRepondre ? null : true, statut: null });
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
