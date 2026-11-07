import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { RUBRIQUES_A_VENIR, RubriqueAVenir } from '../contenu-vitrine';
import { EnteteVitrine } from '../entete-vitrine/entete-vitrine';
import { PiedVitrine } from '../pied-vitrine/pied-vitrine';

/** Rubrique annoncée dans l'en-tête dont le module n'est pas encore livré (routes `/actualite`, `/carriere`). */
@Component({
  selector: 'app-page-bientot',
  imports: [RouterLink, EnteteVitrine, PiedVitrine],
  templateUrl: './page-bientot.html',
  styleUrl: './page-bientot.scss',
})
export class PageBientot {
  protected readonly rubrique: RubriqueAVenir =
    RUBRIQUES_A_VENIR[inject(ActivatedRoute).snapshot.data['rubrique'] as keyof typeof RUBRIQUES_A_VENIR];
}
