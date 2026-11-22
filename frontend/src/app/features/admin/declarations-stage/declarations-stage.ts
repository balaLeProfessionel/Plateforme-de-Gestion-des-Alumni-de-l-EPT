import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import { Declaration } from '../../../core/services/models/stage.model';
import { CompteurDeclarationsATraiter } from '../../../core/services/stages/compteur-declarations';
import { DeclarationsStageService } from '../../../core/services/stages/declarations';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';
import { CarteDeclaration } from './carte-declaration/carte-declaration';

type Onglet = 'DECLARE' | 'CONFIRME' | 'REFUSE';

/** « ?statut=CONFIRME » ou « ?statut=REFUSE » ; sans paramètre, la file à traiter. */
function ongletDepuis(statut: string | null): Onglet {
  return statut === 'CONFIRME' || statut === 'REFUSE' ? statut : 'DECLARE';
}

/** Stages trouvés par les étudiants hors offre (STA-10) : la file à valider ou refuser, puis l’historique. */
@Component({
  selector: 'app-declarations-stage',
  imports: [PageAdmin, PaginationAdmin, CarteDeclaration],
  templateUrl: './declarations-stage.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', '../offres-stage/offres-stage.scss'],
})
export class DeclarationsStage {
  private readonly service = inject(DeclarationsStageService);
  private readonly compteur = inject(CompteurDeclarationsATraiter);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }];
  protected readonly onglets: readonly { valeur: Onglet; libelle: string }[] = [
    { valeur: 'DECLARE', libelle: 'À traiter' }, { valeur: 'CONFIRME', libelle: 'Validés' }, { valeur: 'REFUSE', libelle: 'Refusés' },
  ];
  protected readonly onglet = signal<Onglet>('DECLARE');
  protected readonly page = signal<Page<Declaration> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  private numeroPage = 0;

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => ({ onglet: ongletDepuis(params.get('statut')), page: Math.max(0, Number(params.get('page')) || 0) })),
      tap(({ onglet, page }) => {
        this.onglet.set(onglet);
        this.numeroPage = page;
        this.erreurChargement.set(null);
      }),
      switchMap(({ onglet, page }) => this.service.lister(onglet, page).pipe(
        catchError((erreur: HttpErrorResponse) => {
          this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les stages déclarés.');
          return of(null);
        }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => this.page.set(page));
  }

  protected choisirOnglet(onglet: Onglet): void {
    this.message.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { statut: onglet === 'DECLARE' ? null : onglet } });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  protected apresDecision(message: string): void {
    this.message.set(message);
    this.compteur.actualiser();
    this.service.lister(this.onglet(), this.numeroPage).subscribe({
      next: (page) => this.page.set(page),
      error: () => this.erreurChargement.set('Impossible de recharger les stages déclarés.'),
    });
  }
}
