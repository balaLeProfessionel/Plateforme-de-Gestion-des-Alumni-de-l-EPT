import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { libelleClasse } from '../../../core/services/models/classe.model';
import { LIBELLES_CONVENTION, LIBELLES_DEROULEMENT, LIBELLES_TYPE_STAGE, SuiviStage } from '../../../core/services/models/stage.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

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

  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly deroulements = LIBELLES_DEROULEMENT;
  protected readonly conventions = LIBELLES_CONVENTION;
  protected readonly libelleClasse = libelleClasse;
}
