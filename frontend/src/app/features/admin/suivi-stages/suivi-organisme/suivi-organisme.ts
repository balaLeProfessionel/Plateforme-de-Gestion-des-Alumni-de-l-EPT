import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Page } from '../../../../core/services/models/mentorat.model';
import { SuiviStage } from '../../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../../core/services/stages/suivi-stages';
import { FicheSuivi } from '../../../stages/fiche-suivi/fiche-suivi';
import { PageAdmin } from '../../page-admin/page-admin';
import { PaginationAdmin } from '../../pagination-admin/pagination-admin';
import { ActionsSuivi } from '../actions-suivi/actions-suivi';
import { filtresDepuis, parametresFiltres } from '../filtres-suivi';

/**
 * Stagiaires d’un organisme d’accueil (deuxième niveau du suivi) : fiches avec désignation de l’encadrant, maître de
 * stage, convention, évaluation, rapport, et date limite des rapports pour ces stagiaires. Les filtres de la liste des
 * organismes s’appliquent aussi ici, et le lien de retour les rend.
 */
@Component({
  selector: 'app-suivi-organisme',
  imports: [RouterLink, PageAdmin, PaginationAdmin, FicheSuivi, ActionsSuivi],
  templateUrl: './suivi-organisme.html',
  styleUrls: ['../../formulaire-admin.scss', '../../etats-admin.scss', '../suivi-stages.scss', './suivi-organisme.scss'],
})
export class SuiviOrganismePage {
  private readonly service = inject(SuiviStagesService);
  private readonly params = inject(ActivatedRoute).snapshot.queryParamMap;

  protected readonly filtres = filtresDepuis(this.params);
  protected readonly retour = parametresFiltres(this.filtres);
  protected readonly filtre = this.filtres.texte.trim() !== '' || this.filtres.filiere !== '' || this.filtres.sansEncadrant;
  private readonly organisme = { id: this.params.get('organisme'), nom: this.params.get('nom') };

  protected readonly parents = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Suivi des stages', lien: '/admin/stages/suivi' }];
  protected readonly page = signal<Page<SuiviStage> | null>(null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly dateLimite = signal('');
  protected readonly erreurDateLimite = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly titre = computed(() => this.page()?.contenu[0]?.organisme ?? this.organisme.nom ?? 'Stagiaires de l’organisme');

  constructor() {
    this.charger(0);
  }

  protected charger(numero: number): void {
    this.service.lister(this.filtres, this.organisme, numero).subscribe({
      next: (p) => { this.erreurChargement.set(null); this.page.set(p); },
      error: (erreur: HttpErrorResponse) => this.erreurChargement.set(erreur.error?.message ?? 'Impossible de charger les stagiaires.'),
    });
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
        this.message.set(`Date limite des rapports fixée pour ${misAJour} stagiaire${misAJour > 1 ? 's' : ''}.`);
        this.charger(this.page()?.page ?? 0);
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
