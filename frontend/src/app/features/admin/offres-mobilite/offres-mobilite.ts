import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  LIBELLES_STATUT_OFFRE_MOBILITE, LIBELLES_TYPE_MOBILITE, OffreMobilite, periodeLisible, StatutOffreMobilite,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

type Onglet = StatutOffreMobilite | '';

const ONGLETS: readonly Onglet[] = ['PUBLIEE', 'CLOTUREE', 'LISTE_PUBLIEE', 'RETIREE', ''];

/** « ?statut=CLOTUREE »… ou « ?statut=toutes » ; sans paramètre, les offres publiées. */
function ongletDepuis(statut: string | null): Onglet {
  if (statut === 'toutes') return '';
  return ONGLETS.includes(statut as Onglet) && statut ? statut as Onglet : 'PUBLIEE';
}

/**
 * Offres de mobilité vues par le chef du service mobilité : toutes les offres par statut, le retrait d’une offre avec
 * un motif envoyé à l’institut, la publication d’une offre au nom d’un établissement.
 */
@Component({
  selector: 'app-offres-mobilite',
  imports: [DatePipe, RouterLink, PageAdmin, PaginationAdmin],
  templateUrl: './offres-mobilite.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', '../offres-stage/offres-stage.scss'],
})
export class OffresMobiliteAdmin {
  private readonly service = inject(OffresMobiliteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly onglets: readonly { valeur: Onglet; libelle: string }[] = [
    { valeur: 'PUBLIEE', libelle: 'Publiées' }, { valeur: 'CLOTUREE', libelle: 'Closes' },
    { valeur: 'LISTE_PUBLIEE', libelle: 'Listes publiées' }, { valeur: 'RETIREE', libelle: 'Retirées' }, { valeur: '', libelle: 'Toutes' },
  ];
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly statuts = LIBELLES_STATUT_OFFRE_MOBILITE;
  protected readonly periode = periodeLisible;
  protected readonly onglet = signal<Onglet>('PUBLIEE');
  protected readonly page = signal<Page<OffreMobilite> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly aRetirer = signal<string | null>(null);
  protected readonly motif = signal('');
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly enCours = signal(false);
  private numeroPage = 0;

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => ({ onglet: ongletDepuis(params.get('statut')), page: Math.max(0, Number(params.get('page')) || 0) })),
      tap(({ onglet, page }) => {
        this.onglet.set(onglet);
        this.numeroPage = page;
        this.erreurChargement.set(null);
      }),
      switchMap(({ onglet, page }) => this.service.listerPourChef(onglet, page).pipe(
        catchError((erreur: HttpErrorResponse) => {
          this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les offres.');
          return of(null);
        }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => this.page.set(page));
  }

  protected choisirOnglet(onglet: Onglet): void {
    this.message.set(null);
    this.aRetirer.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { statut: onglet === 'PUBLIEE' ? null : onglet || 'toutes' } });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  protected ouvrir(offre: OffreMobilite): void {
    this.aRetirer.set(offre.id);
    this.motif.set('');
    this.erreurAction.set(null);
  }

  protected saisirMotif(evenement: Event): void {
    this.motif.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected retirer(offre: OffreMobilite): void {
    const motif = this.motif().trim();
    if (!motif) {
      this.erreurAction.set('Le motif est obligatoire : il est envoyé à l’établissement.');
      return;
    }
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreurAction.set(null);
    this.service.retirer(offre.id, motif).subscribe({
      next: () => {
        this.enCours.set(false);
        this.aRetirer.set(null);
        this.message.set(`« ${offre.titre} » est retirée. L’établissement reçoit le motif.`);
        this.recharger();
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAction.set(erreur.error?.message ?? 'Le retrait a échoué. Réessayez.');
      },
    });
  }

  private recharger(): void {
    this.service.listerPourChef(this.onglet(), this.numeroPage).subscribe({
      next: (page) => this.page.set(page),
      error: () => this.erreurChargement.set('Impossible de recharger les offres.'),
    });
  }
}
