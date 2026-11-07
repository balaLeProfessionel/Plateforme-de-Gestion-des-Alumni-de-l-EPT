import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ContenuPublicService } from '../../../core/services/vitrine/contenu-public';
import { VisuelEvenement } from '../../../shared/images/visuel-evenement';

/** Pour l'instant, les actualités de l'école sont ses événements. */
@Component({
  selector: 'app-actualites-vitrine',
  imports: [DatePipe, RouterLink, VisuelEvenement],
  templateUrl: './actualites-vitrine.html',
  styleUrl: './actualites-vitrine.scss',
})
export class ActualitesVitrine {
  /** `undefined` pendant le chargement : la section garde sa place pour que l'ancre `#actualites` fonctionne. */
  protected readonly evenements = toSignal(
    inject(ContenuPublicService).prochainsEvenements().pipe(catchError(() => of([])))
  );
  protected readonly masquee = computed(() => this.evenements()?.length === 0);
}
