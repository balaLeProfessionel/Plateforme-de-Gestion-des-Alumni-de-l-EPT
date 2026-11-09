import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Message } from 'primeng/message';
import { Skeleton } from 'primeng/skeleton';
import { catchError, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';
import {
  ArticleService, LIBELLES_THEME, PageArticles, THEMES_ARTICLE, ThemeArticle,
} from '../../../core/services/articles/article';
import { CarteArticle } from '../../../shared/articles/carte-article';
import { Onglet, Onglets } from '../../../shared/onglets/onglets';

const DELAI_SAISIE_MS = 300;
const TAILLE_PAGE = 12;

interface Criteres {
  vue: 'bibliotheque' | 'mes';
  theme: ThemeArticle | null;
  recherche: string;
  page: number;
}

/** Bibliothèque des articles publiés, et « Mes articles » (brouillons compris) pour leur auteur. */
@Component({
  selector: 'app-bibliotheque-articles',
  imports: [FormField, RouterLink, ButtonDirective, ButtonIcon, ButtonLabel, Message, Skeleton, CarteArticle, Onglets],
  templateUrl: './bibliotheque-articles.html',
  styleUrl: './bibliotheque-articles.scss',
})
export class BibliothequeArticles {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(ArticleService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly themes = THEMES_ARTICLE;
  protected readonly libellesThemes = LIBELLES_THEME;
  protected readonly criteres = signal<Criteres>({ vue: 'bibliotheque', theme: null, recherche: '', page: 0 });
  protected readonly vues = computed((): readonly Onglet[] => [
    { libelle: 'Bibliothèque', lien: '/articles', actif: this.criteres().vue === 'bibliotheque' },
    { libelle: 'Mes articles', lien: '/articles', parametres: { vue: 'mes' }, actif: this.criteres().vue === 'mes' },
  ]);
  protected readonly resultat = signal<PageArticles | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele);
  protected readonly filtre = computed(() => !!this.criteres().theme || !!this.criteres().recherche);

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => this.criteresDepuis(params)),
      tap((criteres) => {
        if (this.criteres().vue !== criteres.vue) this.resultat.set(null);
        this.criteres.set(criteres);
        if (this.modele().recherche.trim() !== criteres.recherche) this.modele.set({ recherche: criteres.recherche });
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((criteres) => (criteres.vue === 'mes'
        ? this.service.miens(criteres.page, TAILLE_PAGE)
        : this.service.lister(criteres, TAILLE_PAGE)).pipe(
        map((page) => ({ page, erreur: null })),
        catchError((erreur: HttpErrorResponse) =>
          of({ page: null, erreur: erreur.error?.message ?? 'Impossible de charger les articles. Réessayez.' })))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ page, erreur }) => {
      this.resultat.set(page);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });

    toObservable(this.modele).pipe(
      skip(1), debounceTime(DELAI_SAISIE_MS),
      map(({ recherche }) => recherche.trim()), distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((recherche) => { if (recherche !== this.criteres().recherche) this.appliquer({ recherche }); });
  }

  protected choisirTheme(theme: ThemeArticle | null): void {
    if (theme !== this.criteres().theme) this.appliquer({ theme });
  }

  protected appliquerRecherche(): void {
    this.appliquer({ recherche: this.modele().recherche.trim() });
  }

  protected effacerFiltres(): void {
    this.modele.set({ recherche: '' });
    this.appliquer({ theme: null, recherche: '' });
  }

  protected allerPage(page: number): void {
    this.naviguer({ ...this.criteres(), page }, false);
  }

  private appliquer(changement: Partial<Criteres>): void {
    this.naviguer({ ...this.criteres(), ...changement, page: 0 }, true);
  }

  private naviguer(criteres: Criteres, remplacer: boolean): void {
    const queryParams: Record<string, string | number> = {};
    if (criteres.vue === 'mes') queryParams['vue'] = 'mes';
    if (criteres.theme) queryParams['theme'] = criteres.theme;
    if (criteres.recherche) queryParams['recherche'] = criteres.recherche;
    if (criteres.page > 0) queryParams['page'] = criteres.page;
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }

  private criteresDepuis(params: ParamMap): Criteres {
    const theme = params.get('theme');
    const page = Number(params.get('page'));
    return {
      vue: params.get('vue') === 'mes' ? 'mes' : 'bibliotheque',
      theme: THEMES_ARTICLE.includes(theme as ThemeArticle) ? theme as ThemeArticle : null,
      recherche: (params.get('recherche') ?? '').trim().slice(0, 100),
      page: Number.isInteger(page) && page > 0 ? page : 0,
    };
  }
}
