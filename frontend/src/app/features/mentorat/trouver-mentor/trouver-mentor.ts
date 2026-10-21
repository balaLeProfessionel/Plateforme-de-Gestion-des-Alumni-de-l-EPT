import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, skip, switchMap, tap } from 'rxjs';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import { CriteresMentors, Mentor, Page } from '../../../core/services/models/mentorat.model';
import { CarteMentor } from '../carte-mentor/carte-mentor';
import { DialogueDemande } from '../dialogue-demande/dialogue-demande';

const DELAI_SAISIE_MS = 300;

@Component({
  selector: 'app-trouver-mentor',
  imports: [FormField, RouterLink, CarteMentor, DialogueDemande],
  templateUrl: './trouver-mentor.html',
  styleUrl: './trouver-mentor.scss',
})
export class TrouverMentor {
  private readonly mentoratService = inject(MentoratService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly compteur = inject(CompteurDemandesMentorat);

  protected readonly domaines = toSignal(
    this.mentoratService.listerDomaines().pipe(catchError(() => of([]))), { initialValue: [] });
  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele);
  protected readonly criteres = signal<CriteresMentors>({ recherche: '', domaine: '', disponibles: false, page: 0 });
  protected readonly resultat = signal<Page<Mentor> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly mentorSollicite = signal<Mentor | null>(null);
  protected readonly confirmation = signal<string | null>(null);
  protected readonly pages = computed(() =>
    Array.from({ length: this.resultat()?.totalPages ?? 0 }, (_, index) => index));

  constructor() {
    this.compteur.actualiser();
    // L’URL porte les critères : la recherche se partage et se retrouve au retour.
    this.route.queryParamMap.pipe(
      map((params) => this.criteresDepuis(params)),
      tap((criteres) => {
        this.criteres.set(criteres);
        if (this.modele().recherche.trim() !== criteres.recherche) this.modele.set({ recherche: criteres.recherche });
        this.enChargement.set(true);
        this.messageErreur.set(null);
      }),
      switchMap((criteres) => this.mentoratService.rechercherMentors(criteres).pipe(
        map((page) => ({ page, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          page: null,
          erreur: erreur.error?.message ?? 'Impossible de charger les mentors.',
        })))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ page, erreur }) => {
      this.resultat.set(page);
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
      if (recherche !== this.criteres().recherche) this.appliquer({ recherche });
    });
  }

  protected appliquerRecherche(): void {
    this.appliquer({ recherche: this.modele().recherche.trim() });
  }

  protected choisirDomaine(domaine: string): void {
    this.appliquer({ domaine });
  }

  protected basculerDisponibles(event: Event): void {
    this.appliquer({ disponibles: (event.target as HTMLInputElement).checked });
  }

  protected changerPage(page: number): void {
    this.naviguer({ ...this.criteres(), page }, false);
  }

  protected solliciter(mentor: Mentor): void {
    this.confirmation.set(null);
    this.mentorSollicite.set(mentor);
  }

  protected demandeEnvoyee(): void {
    const mentor = this.mentorSollicite();
    this.mentorSollicite.set(null);
    if (!mentor) return;
    this.confirmation.set(`Votre demande a été envoyée à ${mentor.prenom} ${mentor.nom}.`);
    this.compteur.actualiser();
    this.resultat.update((page) => page && {
      ...page,
      contenu: page.contenu.map((m) => m.profilId === mentor.profilId ? { ...m, demandeEnCours: true } : m),
    });
  }

  /** Un changement de critère revient à la première page sans empiler l’historique. */
  private appliquer(changement: Partial<CriteresMentors>): void {
    this.naviguer({ ...this.criteres(), ...changement, page: 0 }, true);
  }

  private naviguer({ recherche, domaine, disponibles, page }: CriteresMentors, remplacer: boolean): void {
    const queryParams: Record<string, string | number> = {};
    if (recherche) queryParams['recherche'] = recherche;
    if (domaine) queryParams['domaine'] = domaine;
    if (disponibles) queryParams['disponibles'] = 'oui';
    if (page > 0) queryParams['page'] = page;
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: remplacer });
  }

  private criteresDepuis(params: ParamMap): CriteresMentors {
    const page = Number(params.get('page'));
    return {
      recherche: params.get('recherche') ?? '',
      domaine: params.get('domaine') ?? '',
      disponibles: params.get('disponibles') === 'oui',
      page: Number.isInteger(page) && page > 0 ? page : 0,
    };
  }
}
