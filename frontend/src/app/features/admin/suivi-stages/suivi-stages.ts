import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, merge, of, Subject, switchMap } from 'rxjs';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { Page } from '../../../core/services/models/mentorat.model';
import { SuiviStage } from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { FicheSuivi } from '../../stages/fiche-suivi/fiche-suivi';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';
import { ActionsSuivi } from './actions-suivi/actions-suivi';

interface Criteres { texte: string; filiere: string; sansEncadrant: boolean; page: number }

/** Suivi des stages confirmés (STA-08) : l’administrateur Stages désigne les encadrants et tient à jour les maîtres de stage. */
@Component({
  selector: 'app-suivi-stages',
  imports: [PageAdmin, PaginationAdmin, FicheSuivi, ActionsSuivi],
  templateUrl: './suivi-stages.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss', './suivi-stages.scss'],
})
export class SuiviStagesPage {
  private readonly service = inject(SuiviStagesService);

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }];
  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly criteres = signal<Criteres>({ texte: '', filiere: '', sansEncadrant: false, page: 0 });
  protected readonly page = signal<Page<SuiviStage> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly dateLimite = signal('');
  protected readonly erreurDateLimite = signal<string | null>(null);
  protected readonly enCours = signal(false);
  private readonly immediat = new Subject<void>();
  private readonly differe = new Subject<void>();

  constructor() {
    merge(this.immediat, this.differe.pipe(debounceTime(300))).pipe(
      map(() => this.criteres()),
      switchMap((c) => this.service.lister(c, c.page).pipe(catchError((erreur: HttpErrorResponse) => {
        this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les stages.');
        return of(null);
      }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => {
      if (page) this.erreurChargement.set(null);
      this.page.set(page);
    });
    this.immediat.next();
  }

  protected saisirTexte(evenement: Event): void {
    this.criteres.update((c) => ({ ...c, texte: (evenement.target as HTMLInputElement).value, page: 0 }));
    this.differe.next();
  }

  protected choisirFiliere(evenement: Event): void {
    this.criteres.update((c) => ({ ...c, filiere: (evenement.target as HTMLSelectElement).value, page: 0 }));
    this.immediat.next();
  }

  protected basculerSansEncadrant(evenement: Event): void {
    this.criteres.update((c) => ({ ...c, sansEncadrant: (evenement.target as HTMLInputElement).checked, page: 0 }));
    this.immediat.next();
  }

  protected changerPage(page: number): void {
    this.criteres.update((c) => ({ ...c, page }));
    this.immediat.next();
  }

  protected saisirDateLimite(evenement: Event): void {
    this.dateLimite.set((evenement.target as HTMLInputElement).value);
  }

  protected appliquerDateLimite(stages: readonly SuiviStage[]): void {
    const date = this.dateLimite();
    if (!date) {
      this.erreurDateLimite.set('Choisissez la date limite.');
      return;
    }
    this.enCours.set(true);
    this.erreurDateLimite.set(null);
    this.service.fixerDateLimiteRapports(stages.map((s) => s.id), date).subscribe({
      next: ({ misAJour }) => {
        this.enCours.set(false);
        this.message.set(`Date limite des rapports fixée pour ${misAJour} stage${misAJour > 1 ? 's' : ''}.`);
        this.immediat.next();
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurDateLimite.set(erreur.error?.message ?? 'La date limite n’a pas pu être fixée. Réessayez.');
      },
    });
  }

  protected apresModification({ stage, message }: { stage: SuiviStage; message: string }): void {
    this.message.set(message);
    this.page.update((p) => p && { ...p, contenu: p.contenu.map((s) => s.id === stage.id ? stage : s) });
  }
}
