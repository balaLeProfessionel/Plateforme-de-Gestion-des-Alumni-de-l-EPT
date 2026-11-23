import { Component, computed, input } from '@angular/core';
import { LIBELLES_STATUT_ACCORD, StatutAccord, tonAccord } from '../../../core/services/models/partenariat.model';

/** Pastille du statut d’un accord, aux mêmes couleurs que celle des conventions. */
@Component({
  selector: 'app-statut-accord',
  template: `{{ libelle() }}`,
  host: { '[attr.data-ton]': 'ton()' },
  styleUrl: '../statut-convention/statut-pastille.scss',
})
export class StatutAccordPastille {
  readonly statut = input.required<StatutAccord>();
  protected readonly libelle = computed(() => LIBELLES_STATUT_ACCORD[this.statut()]);
  protected readonly ton = computed(() => tonAccord(this.statut()));
}
