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
import { chercherPages } from './pages-site';

const DELAI_SAISIE_MS = 300;

/** Recherche sur tout le site, accessible sans compte (route `/recherche`) : pages et diplômés. */
@Component({
  selector: 'app-recherche-site',
  imports: [FormField, RouterLink, EnteteVitrine, PiedVitrine],
  templateUrl: './recherche-site.html',
  styleUrl: './recherche-site.scss',
})
export class RechercheSite {
  private readonly service = inject(AnnuaireService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele);

  /** Critère de l'URL, source de vérité. */
  protected readonly critere = signal('');
  protected readonly pages = computed(() => chercherPages(this.critere()));
  protected readonly diplomes = signal<readonly DiplomePublic[]>([]);
  protected readonly enChargement = signal(false);
  protected readonly erreurDiplomes = signal<string | null>(null);
  protected readonly chercheDiplomes = computed(() => assezDeLettres(this.critere()));
  protected readonly aucunResultat = computed(() =>
    !!this.critere() && !this.enChargement() && !this.erreurDiplomes() && !this.pages().length && !this.diplomes().length
  );

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => (params.get('q') ?? '').trim()),
      tap((critere) => {
        this.critere.set(critere);
        if (this.modele().recherche.trim() !== critere) this.modele.set({ recherche: critere });
        this.erreurDiplomes.set(null);
        this.diplomes.set([]);
        this.enChargement.set(assezDeLettres(critere));
      }),
      switchMap((critere) => {
        if (!assezDeLettres(critere)) return EMPTY;
        return this.service.rechercherPublic(critere).pipe(
          map((liste) => ({ liste, erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({ liste: [], erreur: this.messageDepuis(erreur) }))
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ liste, erreur }) => {
      this.diplomes.set(liste);
      this.erreurDiplomes.set(erreur);
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
      queryParams: recherche ? { q: recherche } : {},
      replaceUrl: true
    });
  }

  private messageDepuis(erreur: HttpErrorResponse): string {
    if (erreur.status === 429) return 'Trop de recherches à la suite. Réessayez dans une minute.';
    return 'La recherche de diplômés n’a pas abouti. Réessayez dans un instant.';
  }
}
