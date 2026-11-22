import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { Page } from '../../../core/services/models/mentorat.model';
import { CriteresOffres, LIBELLES_TYPE_STAGE, OffreStage, TYPES_STAGE, TypeStage } from '../../../core/services/models/stage.model';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { CarteOffre } from '../carte-offre/carte-offre';

const DELAI_SAISIE_MS = 300;

/** Offres de stage publiées (STA-02), filtrables par type, organisme et lieu ; les critères sont dans l’URL. */
@Component({
  selector: 'app-liste-offres',
  imports: [FormField, RouterLink, FilAriane, CarteOffre],
  templateUrl: './liste-offres.html',
  styleUrl: './liste-offres.scss',
})
export class ListeOffres {
  private readonly service = inject(OffresStageService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly etapes = [{ libelle: 'Accueil', lien: '/accueil' }, { libelle: 'Stages' }];
  protected readonly types = TYPES_STAGE;
  protected readonly libellesType = LIBELLES_TYPE_STAGE;
  protected readonly estOrganisme = computed(() => this.authService.utilisateur()?.role === 'ORGANISME');
  protected readonly estEtudiant = computed(() => this.authService.utilisateur()?.role === 'ETUDIANT');
  protected readonly estPersonnel = computed(() => this.authService.utilisateur()?.role === 'PERSONNEL');
  protected readonly gereLesOffres = computed(() => this.authService.aPermission('GERER_STAGES'));
  protected readonly organismes = toSignal(this.service.organismes().pipe(catchError(() => of([]))), { initialValue: [] });

  protected readonly modele = signal({ lieu: '' });
  protected readonly formulaire = form(this.modele);
  protected readonly criteres = signal<CriteresOffres>({ type: '', organisme: '', lieu: '', ouvertes: true, page: 0 });
  protected readonly resultat = signal<Page<OffreStage> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly filtresActifs = computed(() => {
    const { type, organisme, lieu, ouvertes } = this.criteres();
    return Boolean(type || organisme || lieu || !ouvertes);
  });

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => this.criteresDepuis(params)),
      tap((criteres) => {
        this.criteres.set(criteres);
        if (this.modele().lieu.trim() !== criteres.lieu) this.modele.set({ lieu: criteres.lieu });
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((criteres) => this.service.rechercher(criteres).pipe(
        map((page) => ({ page, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          page: null, erreur: erreur.error?.message ?? 'Impossible de charger les offres de stage.',
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
      map(({ lieu }) => lieu.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((lieu) => {
      if (lieu !== this.criteres().lieu) this.appliquer({ lieu });
    });
  }

  protected appliquerLieu(): void {
    this.appliquer({ lieu: this.modele().lieu.trim() });
  }

  protected choisirType(type: TypeStage | ''): void {
    this.appliquer({ type });
  }

  protected choisirOrganisme(evenement: Event): void {
    this.appliquer({ organisme: (evenement.target as HTMLSelectElement).value });
  }

  protected basculerOuvertes(evenement: Event): void {
    this.appliquer({ ouvertes: (evenement.target as HTMLInputElement).checked });
  }

  protected reinitialiser(): void {
    this.appliquer({ type: '', organisme: '', lieu: '', ouvertes: true });
  }

  protected changerPage(page: number): void {
    this.naviguer({ ...this.criteres(), page }, false);
  }

  private appliquer(changement: Partial<CriteresOffres>): void {
    this.naviguer({ ...this.criteres(), ...changement, page: 0 }, true);
  }

  private naviguer({ type, organisme, lieu, ouvertes, page }: CriteresOffres, remplacer: boolean): void {
    const queryParams: Record<string, string | number> = {};
    if (type) queryParams['type'] = type;
    if (organisme) queryParams['organisme'] = organisme;
    if (lieu) queryParams['lieu'] = lieu;
    if (!ouvertes) queryParams['closes'] = 'oui';
    if (page > 0) queryParams['page'] = page;
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }

  private criteresDepuis(params: ParamMap): CriteresOffres {
    const page = Number(params.get('page'));
    const type = params.get('type') as TypeStage | null;
    return {
      type: type && TYPES_STAGE.includes(type) ? type : '',
      organisme: params.get('organisme') ?? '',
      lieu: params.get('lieu') ?? '',
      ouvertes: params.get('closes') !== 'oui',
      page: Number.isInteger(page) && page > 0 ? page : 0,
    };
  }
}
