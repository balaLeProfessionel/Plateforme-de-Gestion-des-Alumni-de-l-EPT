import { Component, computed, input } from '@angular/core';

// Indicateur de progression du parcours de completion.
// Purement presentatif : il ne connait ni le routeur ni les pages.
@Component({
  selector: 'app-indicateur-etapes',
  templateUrl: './indicateur-etapes.html',
  styleUrl: './indicateur-etapes.scss'
})
export class IndicateurEtapes {
  // Numero de l'etape courante, a partir de 1
  readonly etape = input.required<number>();
  readonly libelles = input<readonly string[]>([
    'Informations',
    'Formations',
    'Expériences'
  ]);

  protected readonly total = computed(() => this.libelles().length);

  protected readonly etapes = computed(() =>
    this.libelles().map((libelle, index) => ({
      libelle,
      numero: index + 1,
      courante: index + 1 === this.etape(),
      franchie: index + 1 < this.etape()
    }))
  );
}
