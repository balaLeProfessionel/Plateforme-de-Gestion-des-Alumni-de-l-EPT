import { DatePipe, DOCUMENT } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { libelleClasse } from '../../../core/services/models/classe.model';
import { LIBELLES_DEROULEMENT, LIBELLES_TYPE_STAGE, SuiviStage } from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { EtapesStage } from '../etapes-stage/etapes-stage';
import { enregistrerFichier } from '../../../shared/telecharger';

/**
 * Un stage confirmé dans le suivi (STA-08) : l’étudiant, l’organisme, les dates, l’encadrant interne et le maître de
 * stage. Les actions (désigner, corriger) se projettent dans la carte par le contenu.
 */
@Component({
  selector: 'app-fiche-suivi',
  imports: [DatePipe, RouterLink, AvatarMembre, EtapesStage],
  templateUrl: './fiche-suivi.html',
  styleUrl: './fiche-suivi.scss',
})
export class FicheSuivi {
  readonly stage = input.required<SuiviStage>();
  /** Vue de l’administrateur Stages : le rapport se lit par la route d’administration. */
  readonly ecole = input(false);
  /** Niveau du titre (nom de l'étudiant) : 2 quand la fiche suit directement le h1 de la page. */
  readonly niveauTitre = input<2 | 3>(3);

  private readonly service = inject(SuiviStagesService);
  private readonly document = inject(DOCUMENT);
  protected readonly erreurRapport = signal(false);
  protected readonly erreurConvention = signal(false);

  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly deroulements = LIBELLES_DEROULEMENT;
  protected readonly libelleClasse = libelleClasse;

  protected telechargerRapport(): void {
    const s = this.stage();
    this.erreurRapport.set(false);
    this.service.telechargerRapport(s.id, this.ecole()).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, s.rapport.nomFichier ?? 'rapport.pdf'),
      error: () => this.erreurRapport.set(true),
    });
  }

  protected telechargerConvention(): void {
    const s = this.stage();
    this.erreurConvention.set(false);
    this.service.telechargerConvention(s.id, this.ecole()).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, `convention-${s.etudiant.nom}.pdf`),
      error: () => this.erreurConvention.set(true),
    });
  }
}
