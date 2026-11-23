import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_TYPE_STAGE, OffreStage } from '../../../core/services/models/stage.model';

/** Une offre dans la liste : toute la carte mène au détail (un seul lien étiré). */
@Component({
  selector: 'app-carte-offre',
  imports: [DatePipe, RouterLink],
  templateUrl: './carte-offre.html',
  styleUrl: './carte-offre.scss',
})
export class CarteOffre {
  readonly offre = input.required<OffreStage>();
  protected readonly types = LIBELLES_TYPE_STAGE;
}
