import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type TypeParcours = 'experience' | 'formation';

/** Une expérience ou une formation sur la frise du parcours. */
export interface ElementParcours {
  type: TypeParcours;
  id: string;
  titre: string;
  organisme: string;
  libelleType: string;
  description: string | null;
  periode: string;
  ept: boolean;
  enCours: boolean;
  /** Clé de tri : en cours d’abord, puis du plus récent au plus ancien. */
  tri: string;
}

/** L’adresse qui ouvre la fenêtre d’une étape : ?experience=<id> ou ?formation=<id>. */
export function parametresEtape(element: Pick<ElementParcours, 'type' | 'id'>): Record<string, string> {
  return { [element.type]: element.id };
}

/** Frise du parcours : années à gauche, un point par étape, l’EPT surlignée ; chaque étape ouvre sa fenêtre. */
@Component({
  selector: 'app-frise-parcours',
  imports: [NgOptimizedImage, RouterLink],
  templateUrl: './frise-parcours.html',
  styleUrl: './frise-parcours.scss',
})
export class FriseParcours {
  readonly elements = input.required<ElementParcours[]>();
  /** Une étape est ouverte depuis la frise (et non par une adresse partagée). */
  readonly ouverture = output<void>();

  protected readonly parametresEtape = parametresEtape;
}
