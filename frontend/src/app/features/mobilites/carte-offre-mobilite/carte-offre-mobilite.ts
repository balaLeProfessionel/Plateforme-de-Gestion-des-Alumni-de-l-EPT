import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_TYPE_MOBILITE, OffreMobilite, periodeLisible } from '../../../core/services/models/mobilite.model';

/** Une offre de mobilité dans la liste : toute la carte mène au détail (un seul lien étiré). */
@Component({
  selector: 'app-carte-offre-mobilite',
  imports: [DatePipe, RouterLink],
  templateUrl: './carte-offre-mobilite.html',
  styleUrl: './carte-offre-mobilite.scss',
})
export class CarteOffreMobilite {
  readonly offre = input.required<OffreMobilite>();
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly periode = periodeLisible;
}
