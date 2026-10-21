import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { EtiquetteRole } from '../../../shared/roles/etiquette-role';
import {
  EXPLICATIONS_STATUT_MENTORAT,
  LIBELLES_STATUT_MENTORAT,
  Mentorat,
  Page,
  ParticipantMentorat,
  RoleMentorat,
  StatutMentorat,
} from '../../../core/services/models/mentorat.model';

/** Ce que chaque onglet affiche, déclaré dans les données de sa route. */
export interface VueListeMentorats {
  role: RoleMentorat;
  statuts: StatutMentorat[];
  titreVide: string;
  texteVide: string;
}

@Component({
  selector: 'app-liste-mentorats',
  imports: [DatePipe, FormField, RouterLink, AvatarMembre, EtiquetteRole],
  templateUrl: './liste-mentorats.html',
  styleUrl: './liste-mentorats.scss',
})
export class ListeMentorats {
  private readonly mentoratService = inject(MentoratService);
  private readonly compteur = inject(CompteurDemandesMentorat);
  private readonly destroyRef = inject(DestroyRef);
  private readonly recharger = new Subject<void>();

  protected readonly vue = inject(ActivatedRoute).snapshot.data['vue'] as VueListeMentorats;
  protected readonly libellesStatut = LIBELLES_STATUT_MENTORAT;
  protected readonly explications = EXPLICATIONS_STATUT_MENTORAT;
  protected readonly page = signal<Page<Mentorat> | null>(null);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly numeroPage = signal(0);
  /** Demande dont le panneau de refus est ouvert. */
  protected readonly refusOuvert = signal<string | null>(null);
  protected readonly actionEnCours = signal<string | null>(null);
  protected readonly erreurAction = signal<{ id: string; message: string } | null>(null);
  protected readonly modeleRefus = signal({ motif: '' });
  protected readonly formulaireRefus = form(this.modeleRefus, (champ) => {
    maxLength(champ.motif, 500, { message: 'Le motif ne peut pas dépasser 500 caractères.' });
  });

  constructor() {
    this.recharger.pipe(
      startWith(undefined),
      switchMap(() => this.mentoratService.lister(this.vue.role, this.vue.statuts, this.numeroPage()).pipe(
        map((page) => ({ page, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          page: null,
          erreur: erreur.error?.message ?? 'Impossible de charger les mentorats.',
        })))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ page, erreur }) => {
      this.page.set(page);
      this.messageErreur.set(erreur);
    });
  }

  protected autrePersonne(mentorat: Mentorat): ParticipantMentorat {
    return mentorat.monRole === 'MENTOR' ? mentorat.mentore : mentorat.mentor;
  }

  protected changerPage(numero: number): void {
    this.numeroPage.set(numero);
    this.recharger.next();
  }

  protected ouvrirRefus(mentorat: Mentorat): void {
    this.modeleRefus.set({ motif: '' });
    this.formulaireRefus().reset();
    this.refusOuvert.set(mentorat.id);
  }

  protected accepter(mentorat: Mentorat): void {
    this.executer(mentorat, this.mentoratService.accepter(mentorat.id));
  }

  protected confirmerRefus(mentorat: Mentorat): void {
    if (this.formulaireRefus().invalid()) return;
    const motif = this.modeleRefus().motif.trim();
    this.executer(mentorat, this.mentoratService.refuser(mentorat.id, motif || null));
  }

  protected annuler(mentorat: Mentorat): void {
    this.executer(mentorat, this.mentoratService.annuler(mentorat.id));
  }

  private executer(mentorat: Mentorat, action: Observable<Mentorat>): void {
    if (this.actionEnCours()) return;
    this.actionEnCours.set(mentorat.id);
    this.erreurAction.set(null);
    action.subscribe({
      next: () => {
        this.actionEnCours.set(null);
        this.refusOuvert.set(null);
        if (this.vue.role === 'MENTOR') this.compteur.actualiser();
        this.recharger.next();
      },
      error: (erreur: HttpErrorResponse) => {
        this.actionEnCours.set(null);
        this.erreurAction.set({
          id: mentorat.id,
          message: erreur.error?.message ?? 'L’action n’a pas pu aboutir. Réessayez.',
        });
      },
    });
  }
}
