import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, firstValueFrom, map, of, startWith, Subject, switchMap, tap } from 'rxjs';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { Evenement, PageEvenements, PeriodeEvenement } from '../../../core/services/models/evenement';

@Component({
  selector: 'app-liste-evenements',
  imports: [RouterLink, FilAriane],
  templateUrl: './liste-evenements.html',
  styleUrl: './liste-evenements.scss',
})
export class ListeEvenements {
  private readonly evenementService = inject(EvenementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly actualiserSujet = new Subject<void>();

  protected readonly page = signal<PageEvenements | null>(null);
  protected readonly periode = signal<PeriodeEvenement>('AVENIR');
  protected readonly mesEvenements = signal(false);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly confirmationAnnulation = signal<string | null>(null);
  protected readonly actionEnCours = signal<string | null>(null);
  protected readonly messageErreurAction = signal<string | null>(null);
  protected readonly pagesVisibles = computed<(number | 'ellipsis')[]>(() => {
    const resultat = this.page();
    if (!resultat || resultat.totalPages <= 1) return [];
    if (resultat.totalPages <= 5) {
      return Array.from({ length: resultat.totalPages }, (_, index) => index);
    }
    const candidates = new Set([0, resultat.page - 1, resultat.page, resultat.page + 1,
      resultat.totalPages - 1]);
    const pages = [...candidates].filter((index) => index >= 0 && index < resultat.totalPages)
      .sort((a, b) => a - b);
    return pages.flatMap((index, position) => position > 0 && index - pages[position - 1] > 1
      ? ['ellipsis' as const, index]
      : [index]);
  });

  constructor() {
    combineLatest([
      this.route.queryParamMap,
      this.actualiserSujet.pipe(startWith(undefined))
    ]).pipe(
      map(([params]) => ({
        periode: params.get('periode') === 'PASSES' ? 'PASSES' as const : 'AVENIR' as const,
        mesEvenements: params.get('vue') === 'mes',
        page: this.lirePage(params.get('page'))
      })),
      tap(({ periode, mesEvenements, page }) => {
        this.periode.set(periode);
        this.mesEvenements.set(mesEvenements);
        this.enChargement.set(true);
        this.messageErreur.set(null);
        this.messageErreurAction.set(null);
        this.page.update((courante) => courante ? { ...courante, page } : null);
      }),
      switchMap(({ periode, mesEvenements, page }) => (mesEvenements
        ? this.evenementService.listerMesEvenements(periode, page)
        : this.evenementService.lister(periode, page)).pipe(
        map((resultat) => ({ resultat, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          resultat: null,
          erreur: erreur.status === 403 && mesEvenements
            ? 'Connectez-vous pour consulter vos événements.'
            : erreur.error?.message ?? 'Impossible de charger les événements.'
        }))
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ resultat, erreur }) => {
      this.page.set(resultat);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
    });
  }

  protected changerPeriode(periode: PeriodeEvenement): void {
    if (periode === this.periode()) return;
    this.confirmationAnnulation.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { periode, page: 0 },
      queryParamsHandling: 'merge'
    });
  }

  protected changerPage(page: number): void {
    const resultat = this.page();
    if (!resultat || page < 0 || page >= resultat.totalPages || page === resultat.page) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { periode: this.periode(), page },
      queryParamsHandling: 'merge'
    });
  }

  protected changerVue(mesEvenements: boolean): void {
    if (mesEvenements === this.mesEvenements()) return;
    this.confirmationAnnulation.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { vue: mesEvenements ? 'mes' : null, page: 0 },
      queryParamsHandling: 'merge'
    });
  }

  protected demanderConfirmation(evenement: Evenement): void {
    this.messageErreurAction.set(null);
    this.confirmationAnnulation.set(evenement.id);
  }

  protected abandonnerAnnulation(): void {
    this.confirmationAnnulation.set(null);
    this.messageErreurAction.set(null);
  }

  protected async confirmerAnnulation(evenement: Evenement): Promise<void> {
    if (this.actionEnCours()) return;
    this.actionEnCours.set(evenement.id);
    this.messageErreurAction.set(null);
    try {
      await firstValueFrom(this.evenementService.annuler(evenement.id));
      this.confirmationAnnulation.set(null);
      this.actualiserSujet.next();
    } catch (erreur) {
      this.messageErreurAction.set(erreur instanceof HttpErrorResponse && erreur.status === 404
        ? 'Cet événement n’est plus disponible ou vous ne pouvez pas le gérer.'
        : 'L’annulation a échoué. Réessayez.');
    } finally {
      this.actionEnCours.set(null);
    }
  }

  protected actualiser(): void {
    this.actualiserSujet.next();
  }

  protected urlCourante(): string {
    return this.router.url;
  }

  protected urlDetails(evenement: Evenement): (string | number)[] {
    return ['/evenements', evenement.id];
  }

  protected formaterPeriode(evenement: Evenement): string {
    const debut = new Date(evenement.dateDebut);
    const fin = new Date(evenement.dateFin);
    const date = new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Dakar'
    });
    const heure = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar'
    });
    const memeJour = date.format(debut) === date.format(fin);
    return memeJour
      ? `${date.format(debut)} · ${heure.format(debut)} – ${heure.format(fin)}`
      : `${date.format(debut)} · ${heure.format(debut)} – ${date.format(fin)} · ${heure.format(fin)}`;
  }

  protected libelleAudience(audience: Evenement['audience']): string {
    return ({ ETUDIANTS: 'Étudiants', ALUMNI: 'Alumni', TOUS: 'Tous les membres' })[audience];
  }

  private lirePage(valeur: string | null): number {
    const page = Number(valeur);
    return Number.isSafeInteger(page) && page >= 0 ? page : 0;
  }
}
