import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subject, catchError, map, merge, of, switchMap } from 'rxjs';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import {
  EXPLICATIONS_STATUT_MENTORAT,
  LIBELLES_STATUT_MENTORAT,
  Mentorat,
  MentoratDetail,
} from '../../../core/services/models/mentorat.model';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { EvaluationMentoratCarte } from './evaluation-mentorat/evaluation-mentorat';
import { SeancesMentorat } from './seances-mentorat/seances-mentorat';

@Component({
  selector: 'app-detail-mentorat',
  imports: [DatePipe, RouterLink, BoutonRetour, SeancesMentorat, EvaluationMentoratCarte, AvatarMembre],
  templateUrl: './detail-mentorat.html',
  styleUrl: './detail-mentorat.scss',
})
export class DetailMentorat {
  private readonly mentoratService = inject(MentoratService);
  private readonly route = inject(ActivatedRoute);
  private readonly recharger = new Subject<void>();

  protected readonly libellesStatut = LIBELLES_STATUT_MENTORAT;
  protected readonly explications = EXPLICATIONS_STATUT_MENTORAT;
  protected readonly detail = signal<MentoratDetail | null>(null);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly actionEnCours = signal(false);
  protected readonly confirmationFin = signal(false);

  protected readonly mentorat = computed(() => this.detail()?.mentorat ?? null);
  protected readonly moi = computed(() => {
    const mentorat = this.mentorat();
    if (!mentorat) return '';
    return mentorat.monRole === 'MENTOR' ? mentorat.mentor.id : mentorat.mentore.id;
  });
  /** Titre des séances exportées vers l’agenda. */
  protected readonly intitule = computed(() => {
    const mentorat = this.mentorat();
    if (!mentorat) return '';
    const autre = mentorat.monRole === 'MENTOR' ? mentorat.mentore : mentorat.mentor;
    return `Mentorat ${mentorat.domaine.libelle} avec ${autre.prenom} ${autre.nom}`;
  });
  protected readonly secours = computed(() =>
    this.mentorat()?.monRole === 'MENTOR' ? '/mentorat/mentores' : '/mentorat/suivis');

  constructor() {
    const identifiant = this.route.paramMap.pipe(map((params) => params.get('id') ?? ''));
    merge(identifiant, this.recharger.pipe(map(() => this.route.snapshot.paramMap.get('id') ?? ''))).pipe(
      switchMap((id) => this.mentoratService.obtenir(id).pipe(
        map((detail) => ({ detail, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          detail: null,
          erreur: erreur.status === 404
            ? 'Ce mentorat est introuvable ou ne vous concerne pas.'
            : 'Impossible de charger ce mentorat.',
        })))),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe(({ detail, erreur }) => {
      this.detail.set(detail);
      this.messageErreur.set(erreur);
    });
  }

  protected actualiser(): void {
    this.recharger.next();
  }

  protected terminer(mentorat: Mentorat): void {
    this.executer(this.mentoratService.terminer(mentorat.id));
  }

  protected annuler(mentorat: Mentorat): void {
    this.executer(this.mentoratService.annuler(mentorat.id));
  }

  private executer(action: Observable<Mentorat>): void {
    if (this.actionEnCours()) return;
    this.actionEnCours.set(true);
    this.erreurAction.set(null);
    action.subscribe({
      next: () => {
        this.actionEnCours.set(false);
        this.confirmationFin.set(false);
        this.actualiser();
      },
      error: (erreur: HttpErrorResponse) => {
        this.actionEnCours.set(false);
        this.erreurAction.set(erreur.error?.message ?? 'L’action n’a pas pu aboutir. Réessayez.');
      },
    });
  }
}
