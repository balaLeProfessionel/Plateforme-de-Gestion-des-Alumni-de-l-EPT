import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Convention, etapesConvention } from '../../../core/services/models/partenariat.model';
import { Frise } from '../../../shared/frise/frise';
import { StatutConventionPastille } from '../statut-convention/statut-convention';

/** Avancement et informations d’une convention, communs à l’organisme et au service des Relations extérieures. */
@Component({
  selector: 'app-infos-convention',
  imports: [DatePipe, RouterLink, Frise, StatutConventionPastille],
  templateUrl: './infos-convention.html',
  styleUrl: './infos-convention.scss',
})
export class InfosConvention {
  readonly convention = input.required<Convention>();
  /** Côté école, l’organisme est un lien vers sa fiche. */
  readonly lienOrganisme = input(false);
  protected readonly etapes = computed(() => etapesConvention(this.convention()));
}
