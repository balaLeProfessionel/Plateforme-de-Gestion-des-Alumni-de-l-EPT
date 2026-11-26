import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Programme } from '../../../core/services/models/mentorat.model';

/** Bandeau « Programmes ouverts » de la recherche de mentors : une carte par programme, menant à sa page. */
@Component({
  selector: 'app-programmes-ouverts',
  imports: [RouterLink],
  templateUrl: './programmes-ouverts.html',
  styleUrl: './programmes-ouverts.scss'
})
export class ProgrammesOuverts {
  readonly programmes = input.required<Programme[]>();
}
