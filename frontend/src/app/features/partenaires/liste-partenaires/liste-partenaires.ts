import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  CriteresPartenaires, LIBELLES_TYPE_ORGANISME, Partenaire, TYPES_ORGANISME, TypeOrganisme,
} from '../../../core/services/models/partenariat.model';
import { PartenairesService } from '../../../core/services/partenariats/partenaires';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { CartePartenaire } from '../carte-partenaire/carte-partenaire';

/**
 * Organismes partenaires de l’EPT, pour les étudiants, les alumni et le personnel : critères dans l’URL, recherche
 * appliquée après 300 ms (Entrée l’applique tout de suite), squelettes au premier chargement.
 */
@Component({
  selector: 'app-liste-partenaires',
  imports: [FilAriane, CartePartenaire],
  templateUrl: './liste-partenaires.html',
  styleUrls: ['../../mobilites/liste-offres-mobilite/liste-offres-mobilite.scss', './liste-partenaires.scss'],
})
export class ListePartenaires {
  private readonly service = inject(PartenairesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  protected readonly etapes = [{ libelle: 'Accueil', lien: '/accueil' }, { libelle: 'Partenaires de l’EPT' }];
  protected readonly types = TYPES_ORGANISME;
  protected readonly libellesType = LIBELLES_TYPE_ORGANISME;
  protected readonly secteurs = signal<string[]>([]);
  protected readonly criteres = signal<CriteresPartenaires>({ recherche: '', type: '', secteur: '', page: 0 });
  protected readonly resultat = signal<Page<Partenaire> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly filtresActifs = computed(() => !!(this.criteres().recherche || this.criteres().type || this.criteres().secteur));

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
    this.service.secteurs().pipe(catchError(() => of([]))).subscribe((s) => this.secteurs.set(s));
    this.route.queryParamMap.pipe(
      map((p): CriteresPartenaires => ({
        recherche: (p.get('recherche') ?? '').slice(0, 100),
        type: (TYPES_ORGANISME.includes(p.get('type') as TypeOrganisme) ? p.get('type') : '') as TypeOrganisme | '',
        secteur: (p.get('secteur') ?? '').slice(0, 100),
        page: Math.max(0, Number(p.get('page')) || 0),
      })),
      tap((criteres) => {
        this.criteres.set(criteres);
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((criteres) => this.service.lister(criteres).pipe(catchError(() => {
        this.messageErreur.set('Les partenaires n’ont pas pu être chargés. Réessayez dans un instant.');
        return of(null);
      }))),
      takeUntilDestroyed(),
    ).subscribe((page) => {
      this.resultat.set(page);
      this.enChargement.set(false);
    });
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

  protected choisirType(type: TypeOrganisme | ''): void {
    this.naviguer({ type: type || null });
  }

  protected choisirSecteur(evenement: Event): void {
    this.naviguer({ secteur: (evenement.target as HTMLSelectElement).value || null });
  }

  protected reinitialiser(): void {
    clearTimeout(this.minuterie);
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  private naviguer(params: Record<string, string | null>): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { ...params, page: null }, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
