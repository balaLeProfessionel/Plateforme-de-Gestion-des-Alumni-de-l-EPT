import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import { LIBELLES_STATUT_OFFRE, LIBELLES_TYPE_STAGE, OffreStage, StatutOffre } from '../../../core/services/models/stage.model';
import { CompteurOffresAVerifier } from '../../../core/services/stages/compteur-offres';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

type Onglet = 'SOUMISE' | 'PUBLIEE' | 'LISTE_PUBLIEE' | '';
type Decision = { offreId: string; action: 'refuser' | 'retirer' };

/** « ?statut=PUBLIEE », « ?statut=LISTE_PUBLIEE » ou « ?statut=toutes » ; sans paramètre, la file à vérifier. */
function ongletDepuis(statut: string | null): Onglet {
  if (statut === 'PUBLIEE' || statut === 'LISTE_PUBLIEE') return statut;
  return statut === 'toutes' ? '' : 'SOUMISE';
}

/**
 * Offres de stage vues par l’administrateur Stages (STA-01) : la file des offres à vérifier, à publier ou à refuser
 * avec un motif ; les offres publiées, à retirer avec un motif ; la saisie d’une offre au nom d’un organisme.
 */
@Component({
  selector: 'app-offres-stage',
  imports: [DatePipe, RouterLink, PageAdmin, PaginationAdmin],
  templateUrl: './offres-stage.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './offres-stage.scss'],
})
export class OffresStage {
  private readonly service = inject(OffresStageService);
  /** Le badge de la navigation suit les décisions prises ici. */
  private readonly compteur = inject(CompteurOffresAVerifier);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }];
  protected readonly onglets: readonly { valeur: Onglet; libelle: string }[] = [
    { valeur: 'SOUMISE', libelle: 'À vérifier' }, { valeur: 'PUBLIEE', libelle: 'Publiées' },
    { valeur: 'LISTE_PUBLIEE', libelle: 'Listes publiées' }, { valeur: '', libelle: 'Toutes' },
  ];
  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly statuts = LIBELLES_STATUT_OFFRE;
  protected readonly onglet = signal<Onglet>('SOUMISE');
  protected readonly page = signal<Page<OffreStage> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly decision = signal<Decision | null>(null);
  protected readonly motif = signal('');
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly enCours = signal(false);
  private numeroPage = 0;

  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => ({
        onglet: ongletDepuis(params.get('statut')),
        page: Math.max(0, Number(params.get('page')) || 0),
      })),
      tap(({ onglet, page }) => {
        this.onglet.set(onglet);
        this.numeroPage = page;
        this.erreurChargement.set(null);
      }),
      switchMap(({ onglet, page }) => this.service.listerPourAdministration(onglet as StatutOffre | '', page).pipe(
        catchError((erreur: HttpErrorResponse) => {
          this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les offres.');
          return of(null);
        }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => this.page.set(page));
  }

  protected choisirOnglet(onglet: Onglet): void {
    this.message.set(null);
    this.decision.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { statut: onglet === 'SOUMISE' ? null : onglet || 'toutes' } });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  protected ouvrir(offre: OffreStage, action: Decision['action']): void {
    this.decision.set({ offreId: offre.id, action });
    this.motif.set('');
    this.erreurAction.set(null);
  }

  protected saisirMotif(evenement: Event): void {
    this.motif.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected publier(offre: OffreStage): void {
    this.executer(this.service.publierSoumise(offre.id), `« ${offre.titre} » est publiée. L’organisme en est prévenu par e-mail.`);
  }

  protected confirmer(offre: OffreStage): void {
    const decision = this.decision();
    const motif = this.motif().trim();
    if (!decision) return;
    if (!motif) {
      this.erreurAction.set('Le motif est obligatoire : il est envoyé à l’organisme.');
      return;
    }
    this.executer(decision.action === 'refuser' ? this.service.refuser(offre.id, motif) : this.service.retirer(offre.id, motif),
      decision.action === 'refuser'
        ? `« ${offre.titre} » est refusée. L’organisme reçoit le motif par e-mail.`
        : `« ${offre.titre} » est retirée. L’organisme reçoit le motif par e-mail.`);
  }

  private executer(requete: ReturnType<OffresStageService['publierSoumise']>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreurAction.set(null);
    requete.subscribe({
      next: () => {
        this.enCours.set(false);
        this.decision.set(null);
        this.message.set(message);
        this.recharger();
        this.compteur.actualiser();
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAction.set(erreur.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }

  private recharger(): void {
    this.service.listerPourAdministration(this.onglet() as StatutOffre | '', this.numeroPage).subscribe({
      next: (page) => this.page.set(page),
      error: () => this.erreurChargement.set('Impossible de recharger les offres.'),
    });
  }
}
