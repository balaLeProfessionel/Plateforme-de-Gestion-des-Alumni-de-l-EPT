import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  CriteresOffresEmploi, LIBELLES_TYPE_CONTRAT, OffreEmploi, TYPES_CONTRAT, TypeContrat,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { CarteOffreEmploi } from '../carte-offre-emploi/carte-offre-emploi';

const DELAI_SAISIE_MS = 300;
const CRITERES_VIDES: Omit<CriteresOffresEmploi, 'page'> = { recherche: '', type: '', lieu: '', filiere: '', expirees: false };

/** Offres d’emploi publiées (#221), filtrables ; les critères sont dans l’URL et les offres expirées masquées par défaut. */
@Component({
  selector: 'app-liste-offres-emploi',
  imports: [FormField, RouterLink, FilAriane, CarteOffreEmploi],
  templateUrl: './liste-offres-emploi.html',
  styleUrl: './liste-offres-emploi.scss',
})
export class ListeOffresEmploi {
  private readonly service = inject(OffresEmploiService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly etapes = [{ libelle: 'Accueil', lien: '/accueil' }, { libelle: 'Offres d’emploi' }];
  protected readonly types = TYPES_CONTRAT;
  protected readonly libellesType = LIBELLES_TYPE_CONTRAT;
  protected readonly filieres = inject(FilieresService).proposees();
  private readonly role = computed(() => this.authService.utilisateur()?.role ?? '');
  protected readonly relaie = computed(() => ['ETUDIANT', 'ALUMNI', 'PERSONNEL'].includes(this.role()));
  protected readonly candidat = computed(() => ['ETUDIANT', 'ALUMNI'].includes(this.role()));
  protected readonly organisme = computed(() => this.role() === 'ORGANISME');

  protected readonly modele = signal({ recherche: '', lieu: '' });
  protected readonly formulaire = form(this.modele);
  protected readonly criteres = signal<CriteresOffresEmploi>({ ...CRITERES_VIDES, page: 0 });
  protected readonly resultat = signal<Page<OffreEmploi> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  /** Sur mobile, lieu, filière et offres expirées se replient derrière « Plus de filtres ». */
  protected readonly filtresOuverts = signal(false);
  protected readonly filtresAvancesActifs = computed(() => {
    const { lieu, filiere, expirees } = this.criteres();
    return [lieu, filiere, expirees].filter(Boolean).length;
  });
  protected readonly filtresActifs = computed(() => {
    const { recherche, type, lieu, filiere, expirees } = this.criteres();
    return Boolean(recherche || type || lieu || filiere || expirees);
  });

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => this.criteresDepuis(params)),
      tap((criteres) => {
        this.criteres.set(criteres);
        const saisie = this.modele();
        if (saisie.recherche.trim() !== criteres.recherche || saisie.lieu.trim() !== criteres.lieu) {
          this.modele.set({ recherche: criteres.recherche, lieu: criteres.lieu });
        }
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((criteres) => this.service.rechercher(criteres).pipe(
        map((page) => ({ page, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          page: null, erreur: erreur.error?.message ?? 'Impossible de charger les offres d’emploi.',
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
      map(({ recherche, lieu }) => ({ recherche: recherche.trim(), lieu: lieu.trim() })),
      distinctUntilChanged((a, b) => a.recherche === b.recherche && a.lieu === b.lieu),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((saisie) => {
      const { recherche, lieu } = this.criteres();
      if (saisie.recherche !== recherche || saisie.lieu !== lieu) this.appliquer(saisie);
    });
  }

  protected appliquerSaisie(): void {
    const { recherche, lieu } = this.modele();
    this.appliquer({ recherche: recherche.trim(), lieu: lieu.trim() });
  }

  protected choisirType(type: TypeContrat | ''): void {
    this.appliquer({ type });
  }

  protected choisirFiliere(evenement: Event): void {
    this.appliquer({ filiere: (evenement.target as HTMLSelectElement).value });
  }

  protected basculerExpirees(evenement: Event): void {
    this.appliquer({ expirees: (evenement.target as HTMLInputElement).checked });
  }

  protected reinitialiser(): void {
    this.appliquer({ ...CRITERES_VIDES });
  }

  protected changerPage(page: number): void {
    this.naviguer({ ...this.criteres(), page }, false);
  }

  private appliquer(changement: Partial<CriteresOffresEmploi>): void {
    this.naviguer({ ...this.criteres(), ...changement, page: 0 }, true);
  }

  private naviguer({ recherche, type, lieu, filiere, expirees, page }: CriteresOffresEmploi, remplacer: boolean): void {
    const queryParams: Record<string, string | number> = {};
    if (recherche) queryParams['recherche'] = recherche;
    if (type) queryParams['type'] = type;
    if (lieu) queryParams['lieu'] = lieu;
    if (filiere) queryParams['filiere'] = filiere;
    if (expirees) queryParams['expirees'] = 'oui';
    if (page > 0) queryParams['page'] = page;
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }

  private criteresDepuis(params: ParamMap): CriteresOffresEmploi {
    const page = Number(params.get('page'));
    const type = params.get('type') as TypeContrat | null;
    return {
      recherche: params.get('recherche') ?? '',
      type: type && TYPES_CONTRAT.includes(type) ? type : '',
      lieu: params.get('lieu') ?? '',
      filiere: params.get('filiere') ?? '',
      expirees: params.get('expirees') === 'oui',
      page: Number.isInteger(page) && page > 0 ? page : 0,
    };
  }
}
