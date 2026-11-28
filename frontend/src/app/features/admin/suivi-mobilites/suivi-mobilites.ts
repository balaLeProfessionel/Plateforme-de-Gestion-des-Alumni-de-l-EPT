import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  anneeUniversitaire, LIBELLES_SENS, LIBELLES_STATUT_MOBILITE, Mobilite, SensMobilite, STATUTS_MOBILITE, StatutMobilite, SUITES_STATUT,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

interface Filtres { sens: SensMobilite | ''; statut: StatutMobilite | ''; annee: string; organisme: string }
type Action = { id: string; type: 'refuser' | 'statut'; statut?: StatutMobilite };

/**
 * Suivi des mobilités par le chef du service : filtres par sens, statut et année dans l’URL ; propositions
 * d’accueil à accepter ou refuser ; passage d’une mobilité à « en cours », « terminée » ou « annulée ».
 */
@Component({
  selector: 'app-suivi-mobilites',
  imports: [RouterLink, PageAdmin, PaginationAdmin],
  templateUrl: './suivi-mobilites.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', '../offres-stage/offres-stage.scss', './suivi-mobilites.scss'],
})
export class SuiviMobilites {
  private readonly service = inject(OffresMobiliteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly sens = LIBELLES_SENS;
  protected readonly statuts = LIBELLES_STATUT_MOBILITE;
  protected readonly listeStatuts = STATUTS_MOBILITE;
  protected readonly suites = SUITES_STATUT;
  protected readonly annees = [-1, 0, 1, 2].map((d) => anneeUniversitaire(new Date(), d));
  protected readonly filtres = signal<Filtres>({ sens: '', statut: '', annee: '', organisme: '' });
  protected readonly page = signal<Page<Mobilite> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly action = signal<Action | null>(null);
  protected readonly motif = signal('');
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly enCours = signal(false);
  private numeroPage = 0;

  constructor() {
    this.route.queryParamMap.pipe(
      map((p) => ({
        filtres: {
          sens: (['SORTANTE', 'ENTRANTE'].includes(p.get('sens') ?? '') ? p.get('sens') : '') as SensMobilite | '',
          statut: (STATUTS_MOBILITE.includes(p.get('statut') as StatutMobilite) ? p.get('statut') : '') as StatutMobilite | '',
          annee: /^\d{4}-\d{4}$/.test(p.get('annee') ?? '') ? p.get('annee') ?? '' : '',
          organisme: p.get('organisme') ?? '',
        },
        page: Math.max(0, Number(p.get('page')) || 0),
      })),
      tap(({ filtres, page }) => {
        this.filtres.set(filtres);
        this.numeroPage = page;
        this.erreurChargement.set(null);
      }),
      switchMap(({ filtres, page }) => this.service.mobilites(filtres, page).pipe(catchError((erreur: HttpErrorResponse) => {
        this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les mobilités.');
        return of(null);
      }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => this.page.set(page));
  }

  protected filtrer(cle: keyof Filtres, evenement: Event): void {
    const valeur = (evenement.target as HTMLSelectElement).value;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [cle]: valeur || null, page: null }, queryParamsHandling: 'merge' });
  }

  protected changerPage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: page || null }, queryParamsHandling: 'merge' });
  }

  protected ouvrir(m: Mobilite, type: Action['type'], statut?: StatutMobilite): void {
    this.action.set({ id: m.id, type, statut });
    this.motif.set('');
    this.erreurAction.set(null);
  }

  protected saisirMotif(evenement: Event): void {
    this.motif.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected choisirStatut(m: Mobilite, evenement: Event): void {
    const statut = (evenement.target as HTMLSelectElement).value as StatutMobilite | '';
    (evenement.target as HTMLSelectElement).value = '';
    if (!statut) return;
    if (statut === 'ANNULEE') {
      this.ouvrir(m, 'statut', statut);
      return;
    }
    this.executer(this.service.changerStatut(m.id, statut), `${this.nom(m)} : mobilité « ${this.statuts[statut].toLowerCase()} ».`);
  }

  protected accepter(m: Mobilite): void {
    this.executer(this.service.accepterAccueil(m.id), `${this.nom(m)} est accepté ; l’établissement en est prévenu.`);
  }

  protected confirmer(m: Mobilite): void {
    const action = this.action();
    const motif = this.motif().trim();
    if (!action) return;
    if (!motif) {
      this.erreurAction.set('Le motif est obligatoire.');
      return;
    }
    this.executer(action.type === 'refuser' ? this.service.refuserAccueil(m.id, motif) : this.service.changerStatut(m.id, 'ANNULEE', motif),
      action.type === 'refuser' ? `La proposition de ${this.nom(m)} est refusée ; l’établissement reçoit le motif.` : `La mobilité de ${this.nom(m)} est annulée.`);
  }

  protected nom(m: Mobilite): string {
    return `${m.personne.prenom} ${m.personne.nom}`;
  }

  private executer(requete: ReturnType<OffresMobiliteService['accepterAccueil']>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreurAction.set(null);
    this.message.set(null);
    requete.subscribe({
      next: () => {
        this.enCours.set(false);
        this.action.set(null);
        this.message.set(message);
        this.service.mobilites(this.filtres(), this.numeroPage).subscribe({ next: (page) => this.page.set(page) });
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAction.set(erreur.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
