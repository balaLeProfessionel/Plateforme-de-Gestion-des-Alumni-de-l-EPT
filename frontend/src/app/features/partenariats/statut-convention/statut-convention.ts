import { Component, computed, input } from '@angular/core';
import { LIBELLES_STATUT_CONVENTION, StatutConvention } from '../../../core/services/models/partenariat.model';

/** Pastille du statut d’une convention : vert actif, or en cours de traitement, rouge clos, gris expiré. */
@Component({
  selector: 'app-statut-convention',
  template: `{{ libelle() }}`,
  host: { '[attr.data-ton]': 'ton()' },
  styleUrl: './statut-pastille.scss',
})
export class StatutConventionPastille {
  readonly statut = input.required<StatutConvention>();
  protected readonly libelle = computed(() => LIBELLES_STATUT_CONVENTION[this.statut()]);
  protected readonly ton = computed(() => {
    switch (this.statut()) {
      case 'ACTIVE': return 'actif';
      case 'DEMANDEE': case 'EN_EXAMEN': case 'EN_NEGOCIATION': return 'en-cours';
      case 'REFUSEE': case 'ANNULEE': case 'RESILIEE': return 'clos';
      default: return 'neutre';
    }
  });
}
