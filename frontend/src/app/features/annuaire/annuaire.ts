import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, pattern } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { catchError, combineLatest, map, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { FILIERES } from '../../core/data/filieres';
import { AnnuaireService } from '../../core/services/annuaire/annuaire';
import {
  FiltresAnnuaire,
  PageAnnuaire,
  RoleAnnuaire,
  TriAnnuaire
} from '../../core/services/models/annuaire.model';
import { CarteMembre } from './carte-membre/carte-membre';

@Component({
  selector: 'app-annuaire',
  imports: [FormField, CarteMembre],
  templateUrl: './annuaire.html',
  styleUrl: './annuaire.scss',
})
export class Annuaire {
  private readonly annuaireService = inject(AnnuaireService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actualiserSujet = new Subject<void>();

  protected readonly filieres = FILIERES;
  protected readonly modele = signal({
    recherche: '',
    role: '',
    filiere: '',
    promotion: '',
    ville: '',
    tri: 'ALPHABETIQUE'
  });
  protected readonly formulaire = form(this.modele, (champ) => {
    pattern(champ.promotion, /^$|^(19\d{2}|20\d{2}|21\d{2}|2200)$/, {
      message: 'Indiquez une année comprise entre 1900 et 2200'
    });
  });
  protected readonly resultat = signal<PageAnnuaire | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly nombreFiltresActifs = computed(() => {
    const valeurs = this.modele();
    return [valeurs.role, valeurs.filiere, valeurs.promotion, valeurs.ville]
      .filter((valeur) => valeur.trim() !== '').length
      + (valeurs.tri === 'PROMOTION_DESC' ? 1 : 0);
  });
  protected readonly pagesVisibles = computed<(number | 'ellipsis')[]>(() => {
    const resultat = this.resultat();
    if (!resultat || resultat.totalPages <= 1) {
      return [];
    }
    if (resultat.totalPages <= 5) {
      return Array.from({ length: resultat.totalPages }, (_, index) => index);
    }
    const candidates = new Set([0, resultat.page - 1, resultat.page, resultat.page + 1, resultat.totalPages - 1]);
    const pages = [...candidates].filter((page) => page >= 0 && page < resultat.totalPages).sort((a, b) => a - b);
    return pages.flatMap((page, index) => index > 0 && page - pages[index - 1] > 1
      ? ['ellipsis' as const, page]
      : [page]);
  });

  constructor() {
    combineLatest([
      this.route.queryParamMap,
      this.actualiserSujet.pipe(startWith(undefined))
    ]).pipe(
      map(([params]) => this.filtresDepuis(params)),
      tap((filtres) => {
        this.synchroniserFormulaire(filtres);
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((filtres) => this.annuaireService.rechercher(filtres).pipe(
        map((resultat) => ({ resultat, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          resultat: null,
          erreur: erreur.error?.message ?? "Impossible de charger l'annuaire."
        }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ resultat, erreur }) => {
      this.resultat.set(resultat);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });
  }

  protected appliquerFiltres(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }
    const valeurs = this.modele();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.parametresNonVides({ ...valeurs, page: 0 })
    });
  }

  protected reinitialiser(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected changerPage(page: number): void {
    const resultat = this.resultat();
    if (!resultat || page < 0 || page >= resultat.totalPages || page === resultat.page) {
      return;
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.route.snapshot.queryParams, page }
    });
  }

  protected actualiser(): void {
    this.actualiserSujet.next();
  }

  private filtresDepuis(params: ParamMap): FiltresAnnuaire {
    const role = params.get('role');
    const tri = params.get('tri');
    return {
      recherche: params.get('recherche') ?? '',
      role: this.estRole(role) ? role : '',
      filiere: params.get('filiere') ?? '',
      promotion: params.get('promotion') ?? '',
      ville: params.get('ville') ?? '',
      tri: tri === 'PROMOTION_DESC' ? tri : 'ALPHABETIQUE',
      page: this.entierPositif(params.get('page'), 0),
      taille: 12
    };
  }

  private synchroniserFormulaire(filtres: FiltresAnnuaire): void {
    this.modele.set({
      recherche: filtres.recherche,
      role: filtres.role,
      filiere: filtres.filiere,
      promotion: filtres.promotion,
      ville: filtres.ville,
      tri: filtres.tri
    });
  }

  private parametresNonVides(valeurs: {
    recherche: string;
    role: string;
    filiere: string;
    promotion: string;
    ville: string;
    tri: string;
    page: number;
  }): Record<string, string | number> {
    const params: Record<string, string | number> = {};
    for (const [cle, valeur] of Object.entries(valeurs)) {
      if (valeur !== '' && valeur !== 'ALPHABETIQUE' && !(cle === 'page' && valeur === 0)) {
        params[cle] = typeof valeur === 'string' ? valeur.trim() : valeur;
      }
    }
    return params;
  }

  private estRole(role: string | null): role is RoleAnnuaire {
    return ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'].includes(role ?? '');
  }

  private entierPositif(valeur: string | null, valeurParDefaut: number): number {
    const nombre = Number(valeur);
    return Number.isInteger(nombre) && nombre >= 0 ? nombre : valeurParDefaut;
  }
}
