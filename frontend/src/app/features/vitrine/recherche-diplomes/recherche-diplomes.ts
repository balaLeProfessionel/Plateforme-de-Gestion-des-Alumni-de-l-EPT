import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';

import { AnnuaireService, assezDeLettres } from '../../../core/services/annuaire/annuaire';
import { DiplomePublic } from '../../../core/services/models/annuaire.model';
import { EnteteVitrine } from '../entete-vitrine/entete-vitrine';
import { PiedVitrine } from '../pied-vitrine/pied-vitrine';

const DELAI_SAISIE_MS = 300;
/** Plafond fixé par le serveur : au-delà, on invite à préciser la recherche. */
const RESULTATS_MAX = 10;

/** Recherche de diplômés accessible sans compte (route `/annuaire-diplomes`). */
@Component({
  selector: 'app-recherche-diplomes',
  imports: [FormField, RouterLink, EnteteVitrine, PiedVitrine],
  templateUrl: './recherche-diplomes.html',
  styleUrl: './recherche-diplomes.scss',
})
export class RechercheDiplomes {
  private readonly service = inject(AnnuaireService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele);

  /** Critère de l'URL, source de vérité. */
  protected readonly critere = signal('');
  protected readonly resultats = signal<readonly DiplomePublic[] | null>(null);
  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  protected readonly rechercheValide = computed(() => assezDeLettres(this.critere()));
  protected readonly liste = computed(() => this.resultats() ?? []);
  protected readonly plafondAtteint = computed(() => this.liste().length >= RESULTATS_MAX);

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => (params.get('recherche') ?? '').trim()),
      tap((critere) => {
        this.critere.set(critere);
        if (this.modele().recherche.trim() !== critere) this.modele.set({ recherche: critere });
        this.messageErreur.set(null);
        this.enChargement.set(assezDeLettres(critere));
        if (!assezDeLettres(critere)) this.resultats.set(null);
      }),
      switchMap((critere) => {
        if (!assezDeLettres(critere)) return EMPTY;
        return this.service.rechercherPublic(critere).pipe(
          map((liste) => ({ liste, erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({ liste: null, erreur: this.messageDepuis(erreur) }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ liste, erreur }) => {
      this.resultats.set(liste);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });

    toObservable(this.modele).pipe(
      skip(1),
      debounceTime(DELAI_SAISIE_MS),
      map(({ recherche }) => recherche.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((recherche) => {
      if (recherche !== this.critere()) this.appliquer(recherche);
    });
  }

  protected appliquerRecherche(evenement: Event): void {
    evenement.preventDefault();
    this.appliquer(this.modele().recherche.trim());
  }

  private appliquer(recherche: string): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: recherche ? { recherche } : {},
      replaceUrl: true
    });
  }

  private messageDepuis(erreur: HttpErrorResponse): string {
    if (erreur.status === 429) return 'Trop de recherches à la suite. Réessayez dans une minute.';
    return erreur.error?.message ?? 'La recherche n’a pas abouti. Réessayez dans un instant.';
  }
}
