import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import { FileModerationOffres, OffreAModerer } from '../../../core/services/models/offre-emploi.model';
import {
  CompteurOffresEmploiAModerer, ModerationOffresEmploiService,
} from '../../../core/services/offres-emploi/moderation-offres-emploi';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';
import { CarteOffreAModerer } from './carte-offre-a-moderer/carte-offre-a-moderer';

const FILES: readonly FileModerationOffres[] = ['A_VERIFIER', 'SIGNALEES', 'PUBLIEES'];

/** « ?file=SIGNALEES » ou « ?file=PUBLIEES » ; sans paramètre, la file des offres à vérifier. */
function fileDepuis(valeur: string | null): FileModerationOffres {
  return FILES.find((f) => f === valeur) ?? 'A_VERIFIER';
}

/**
 * Modération des offres d’emploi (#224) : offres des organismes non validés à vérifier, offres signalées par les membres,
 * offres publiées à retirer si besoin. La file et la page vivent dans l’URL.
 */
@Component({
  selector: 'app-moderation-offres-emploi',
  imports: [PageAdmin, PaginationAdmin, CarteOffreAModerer],
  templateUrl: './moderation-offres-emploi.html',
  styleUrls: ['../etats-admin.scss', './moderation-offres-emploi.scss'],
})
export class ModerationOffresEmploi {
  private readonly service = inject(ModerationOffresEmploiService);
  /** Le badge de la navigation suit les décisions prises ici. */
  private readonly compteur = inject(CompteurOffresEmploiAModerer);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly onglets: readonly { valeur: FileModerationOffres; libelle: string }[] = [
    { valeur: 'A_VERIFIER', libelle: 'À vérifier' }, { valeur: 'SIGNALEES', libelle: 'Signalées' }, { valeur: 'PUBLIEES', libelle: 'Publiées' },
  ];
  protected readonly vides: Record<FileModerationOffres, { titre: string; texte: string }> = {
    A_VERIFIER: { titre: 'Aucune offre à vérifier', texte: 'Les offres des organismes que l’école n’a pas encore validés arriveront ici.' },
    SIGNALEES: { titre: 'Aucune offre signalée', texte: 'Les offres signalées par les membres (lien mort, arnaque…) arriveront ici.' },
    PUBLIEES: { titre: 'Aucune offre publiée', texte: 'Les offres publiées ou relayées par les membres apparaîtront ici.' },
  };
  protected readonly file = signal<FileModerationOffres>('A_VERIFIER');
  /** Nombre en attente par onglet (aucun pour les offres publiées, qui ne sont pas une file à traiter). */
  protected readonly enAttente = computed<Record<FileModerationOffres, number>>(() => {
    const { aVerifier, signalees } = this.compteur.parFile();
    return { A_VERIFIER: aVerifier, SIGNALEES: signalees, PUBLIEES: 0 };
  });
  protected readonly page = signal<Page<OffreAModerer> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  private numeroPage = 0;

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => ({ file: fileDepuis(params.get('file')), page: Math.max(0, Number(params.get('page')) || 0) })),
      tap(({ file, page }) => {
        this.file.set(file);
        this.numeroPage = page;
        this.erreurChargement.set(null);
      }),
      switchMap(({ file, page }) => this.service.lister(file, page).pipe(
        catchError((erreur: HttpErrorResponse) => {
          this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les offres.');
          return of(null);
        }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => this.page.set(page));
  }

  protected choisirFile(file: FileModerationOffres): void {
    this.message.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { file: file === 'A_VERIFIER' ? null : file } });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  protected traitee(message: string): void {
    this.message.set(message);
    this.compteur.actualiser();
    this.service.lister(this.file(), this.numeroPage).subscribe({
      next: (page) => this.page.set(page),
      error: () => this.erreurChargement.set('Impossible de recharger les offres.'),
    });
  }
}
