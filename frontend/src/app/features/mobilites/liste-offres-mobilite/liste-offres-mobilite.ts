import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  anneeUniversitaire, CriteresOffresMobilite, LIBELLES_PERIODE, LIBELLES_TYPE_MOBILITE, OffreMobilite, PERIODES_MOBILITE, PeriodeMobilite,
  TYPES_MOBILITE, TypeMobilite,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { CarteOffreMobilite } from '../carte-offre-mobilite/carte-offre-mobilite';

const DELAI_SAISIE_MS = 300;

/** Offres de mobilité visibles d’un étudiant ou d’un enseignant, filtrables ; les critères sont dans l’URL. */
@Component({
  selector: 'app-liste-offres-mobilite',
  imports: [FormField, FilAriane, CarteOffreMobilite],
  templateUrl: './liste-offres-mobilite.html',
  styleUrl: './liste-offres-mobilite.scss',
})
export class ListeOffresMobilite {
  private readonly service = inject(OffresMobiliteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly etapes = [{ libelle: 'Accueil', lien: '/accueil' }, { libelle: 'Mobilités' }];
  protected readonly types = TYPES_MOBILITE;
  protected readonly libellesType = LIBELLES_TYPE_MOBILITE;
  protected readonly periodes = PERIODES_MOBILITE;
  protected readonly libellesPeriode = LIBELLES_PERIODE;
  /** L’année en cours et les deux suivantes : les offres se publient longtemps à l’avance. */
  protected readonly annees = [0, 1, 2].map((decalage) => anneeUniversitaire(new Date(), decalage));

  protected readonly modele = signal({ pays: '' });
  protected readonly formulaire = form(this.modele);
  protected readonly criteres = signal<CriteresOffresMobilite>({ type: '', pays: '', periode: '', annee: '', eligibles: false, page: 0 });
  protected readonly resultat = signal<Page<OffreMobilite> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly filtresActifs = computed(() => {
    const { type, pays, periode, annee, eligibles } = this.criteres();
    return Boolean(type || pays || periode || annee || eligibles);
  });

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => this.criteresDepuis(params)),
      tap((criteres) => {
        this.criteres.set(criteres);
        if (this.modele().pays.trim() !== criteres.pays) this.modele.set({ pays: criteres.pays });
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((criteres) => this.service.rechercher(criteres).pipe(
        map((page) => ({ page, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          page: null, erreur: erreur.error?.message ?? 'Impossible de charger les offres de mobilité.',
        })))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ page, erreur }) => {
      this.resultat.set(page);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });

    toObservable(this.modele).pipe(
      skip(1),
      debounceTime(DELAI_SAISIE_MS),
      map(({ pays }) => pays.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((pays) => {
      if (pays !== this.criteres().pays) this.appliquer({ pays });
    });
  }

  protected appliquerPays(): void {
    this.appliquer({ pays: this.modele().pays.trim() });
  }

  protected choisirType(type: TypeMobilite | ''): void {
    this.appliquer({ type });
  }

  protected choisirPeriode(evenement: Event): void {
    this.appliquer({ periode: (evenement.target as HTMLSelectElement).value as PeriodeMobilite | '' });
  }

  protected choisirAnnee(evenement: Event): void {
    this.appliquer({ annee: (evenement.target as HTMLSelectElement).value });
  }

  protected basculerEligibles(evenement: Event): void {
    this.appliquer({ eligibles: (evenement.target as HTMLInputElement).checked });
  }

  protected reinitialiser(): void {
    this.appliquer({ type: '', pays: '', periode: '', annee: '', eligibles: false });
  }

  protected changerPage(page: number): void {
    this.naviguer({ ...this.criteres(), page }, false);
  }

  private appliquer(changement: Partial<CriteresOffresMobilite>): void {
    this.naviguer({ ...this.criteres(), ...changement, page: 0 }, true);
  }

  private naviguer({ type, pays, periode, annee, eligibles, page }: CriteresOffresMobilite, remplacer: boolean): void {
    const queryParams: Record<string, string | number> = {};
    if (type) queryParams['type'] = type;
    if (pays) queryParams['pays'] = pays;
    if (periode) queryParams['periode'] = periode;
    if (annee) queryParams['annee'] = annee;
    if (eligibles) queryParams['eligibles'] = 'oui';
    if (page > 0) queryParams['page'] = page;
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }

  private criteresDepuis(params: ParamMap): CriteresOffresMobilite {
    const page = Number(params.get('page'));
    const type = params.get('type') as TypeMobilite | null;
    const periode = params.get('periode') as PeriodeMobilite | null;
    const annee = params.get('annee') ?? '';
    return {
      type: type && TYPES_MOBILITE.includes(type) ? type : '',
      pays: params.get('pays') ?? '',
      periode: periode && PERIODES_MOBILITE.includes(periode) ? periode : '',
      annee: /^\d{4}-\d{4}$/.test(annee) ? annee : '',
      eligibles: params.get('eligibles') === 'oui',
      page: Number.isInteger(page) && page > 0 ? page : 0,
    };
  }
}
