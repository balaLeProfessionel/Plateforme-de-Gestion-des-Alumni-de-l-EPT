import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import {
  detailsLisibles, EntreeJournal, LIBELLES_ACTION_ADMIN, LIBELLES_ROLE_COMPTE, TypeActionAdmin,
} from '../../../core/services/models/admin.model';
import { Page } from '../../../core/services/models/mentorat.model';
import { PageAdmin } from '../page-admin/page-admin';

interface FiltreJournal {
  cle: string | null;
  libelle: string;
  types: readonly TypeActionAdmin[];
}

const FILTRES: readonly FiltreJournal[] = [
  { cle: null, libelle: 'Toutes les décisions', types: [] },
  { cle: 'inscriptions', libelle: 'Inscriptions', types: ['VALIDATION_INSCRIPTION', 'REFUS_INSCRIPTION'] },
  { cle: 'suspensions', libelle: 'Suspensions', types: ['SUSPENSION', 'REACTIVATION'] },
  { cle: 'evolutions', libelle: 'Créations et rôles', types: ['CREATION_COMPTE', 'CHANGEMENT_ROLE', 'DIPLOMATION'] },
];

interface EtatJournal { filtre: FiltreJournal; page: number }

/** Journal de toutes les décisions de l’administration ; filtre et page vivent dans l’URL. */
@Component({
  selector: 'app-journal',
  imports: [DatePipe, RouterLink, PageAdmin],
  templateUrl: './journal.html',
  styleUrl: './journal.scss',
})
export class Journal {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly service = inject(AdminComptesService);

  protected readonly filtres = FILTRES;
  protected readonly libellesAction = LIBELLES_ACTION_ADMIN;
  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  protected readonly detailsLisibles = detailsLisibles;
  protected readonly etat = toSignal(this.route.queryParamMap.pipe(map(etatDepuis)), {
    initialValue: etatDepuis(this.route.snapshot.queryParamMap),
  });
  protected readonly resultat = signal<Page<EntreeJournal> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  private readonly resume = viewChild<ElementRef<HTMLElement>>('resume');
  private focaliserResume = false;

  constructor() {
    toObservable(this.etat).pipe(
      tap(() => this.enChargement.set(true)),
      switchMap(({ filtre, page }) => this.service.journal(filtre.types, page).pipe(
        map((resultat) => ({ resultat, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          resultat: null,
          erreur: erreur.error?.message ?? 'Impossible de charger le journal.',
        })))),
      takeUntilDestroyed()
    ).subscribe(({ resultat, erreur }) => {
      this.resultat.set(resultat);
      this.erreur.set(erreur);
      this.enChargement.set(false);
      if (this.focaliserResume) {
        this.focaliserResume = false;
        afterNextRender(() => {
          const resume = this.resume()?.nativeElement;
          resume?.scrollIntoView({ block: 'start' });
          resume?.focus({ preventScroll: true });
        }, { injector: this.injector });
      }
    });
  }

  protected choisir(filtre: FiltreJournal): void {
    this.naviguer(filtre, 0, true);
  }

  protected allerPage(page: number): void {
    this.focaliserResume = true;
    this.naviguer(this.etat().filtre, page, false);
  }

  private naviguer(filtre: FiltreJournal, page: number, remplacer: boolean): void {
    const queryParams: Record<string, string> = {};
    if (filtre.cle) queryParams['filtre'] = filtre.cle;
    if (page > 0) queryParams['page'] = String(page + 1);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }
}

function etatDepuis(params: ParamMap): EtatJournal {
  const page = Number(params.get('page'));
  return {
    filtre: FILTRES.find((filtre) => filtre.cle === params.get('filtre')) ?? FILTRES[0],
    page: Number.isInteger(page) && page > 1 ? page - 1 : 0,
  };
}
