import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { libelleClasse } from '../../../core/services/models/classe.model';
import { LIBELLES_CONVENTION, LIBELLES_DEROULEMENT, LIBELLES_EVALUATION, LIBELLES_TYPE_STAGE, SuiviStage } from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { enregistrerFichier } from '../../../shared/telecharger';

/**
 * Un stage confirmé dans le suivi (STA-08) : l’étudiant, l’organisme, les dates, l’encadrant interne et le maître de
 * stage. Les actions (désigner, corriger) se projettent dans la carte par le contenu.
 */
@Component({
  selector: 'app-fiche-suivi',
  imports: [DatePipe, RouterLink, AvatarMembre],
  templateUrl: './fiche-suivi.html',
  styleUrl: './fiche-suivi.scss',
})
export class FicheSuivi {
  readonly stage = input.required<SuiviStage>();
  /** Vue de l’administrateur Stages : le rapport se lit par la route d’administration. */
  readonly ecole = input(false);

  private readonly service = inject(SuiviStagesService);
  private readonly document = inject(DOCUMENT);
  protected readonly erreurRapport = signal(false);

  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly deroulements = LIBELLES_DEROULEMENT;
  protected readonly conventions = LIBELLES_CONVENTION;
  protected readonly evaluations = LIBELLES_EVALUATION;
  protected readonly libelleClasse = libelleClasse;

  protected telechargerRapport(): void {
    const s = this.stage();
    this.erreurRapport.set(false);
    this.service.telechargerRapport(s.id, this.ecole()).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, s.rapport.nomFichier ?? 'rapport.pdf'),
      error: () => this.erreurRapport.set(true),
    });
  }
}
