import { DatePipe } from '@angular/common';
import { booleanAttribute, Component, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { AUCUN_FILTRE, Evenement, PeriodeEvenement } from '../../../core/services/models/evenement';
import { VisuelEvenement } from '../../../shared/images/visuel-evenement';

const TAILLE_AVENIR = 4;
const TAILLE_PASSES = 3;

interface Selection {
  periode: PeriodeEvenement;
  evenements: Evenement[];
  total: number;
}

/**
 * Événements organisés par l'organisme : ceux à venir, ou à défaut les derniers passés.
 * Sans aucun événement, la section disparaît, sauf pour l'organisme lui-même, invité à en créer un.
 */
@Component({
  selector: 'app-evenements-organisme',
  imports: [DatePipe, RouterLink, VisuelEvenement],
  templateUrl: './evenements-organisme.html',
  styleUrl: './evenements-organisme.scss',
})
export class EvenementsOrganisme {
  private readonly evenementService = inject(EvenementService);

  readonly organismeId = input.required<string>();
  readonly estMaFiche = input(false, { transform: booleanAttribute });

  protected readonly selection = signal<Selection | null>(null);
  protected readonly erreur = signal(false);

  constructor() {
    effect(() => {
      const organisme = this.organismeId();
      untracked(() => this.charger(organisme));
    });
  }

  protected charger(organisme = this.organismeId()): void {
    this.erreur.set(false);
    const filtres = { ...AUCUN_FILTRE, organisme };
    this.evenementService.lister('AVENIR', 0, filtres, TAILLE_AVENIR).pipe(
      switchMap((avenir) => avenir.totalElements > 0
        ? of<Selection>({ periode: 'AVENIR', evenements: avenir.contenu, total: avenir.totalElements })
        : this.evenementService.lister('PASSES', 0, filtres, TAILLE_PASSES).pipe(
          map((passes): Selection => ({ periode: 'PASSES', evenements: passes.contenu, total: passes.totalElements })))),
    ).subscribe({
      next: (selection) => this.selection.set(selection),
      error: () => this.erreur.set(true),
    });
  }
}
