import { Component, computed, input } from '@angular/core';
import { LIBELLES_STATUT_CONVENTION, StatutConvention } from '../../../core/services/models/partenariat.model';

/** Pastille du statut d’une convention : vert actif, or en cours de traitement, rouge clos, gris expiré. */
@Component({
  selector: 'app-statut-convention',
  template: `{{ libelle() }}`,
  host: { '[attr.data-ton]': 'ton()' },
  styles: `
    :host { display: inline-block; justify-self: start; padding: 0.15rem 0.6rem; border-radius: 999px; background: var(--ept-bg);
      color: var(--ept-primary-dark); font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    :host([data-ton='actif']) { background: var(--ept-success-light); color: var(--ept-success-dark); }
    :host([data-ton='en-cours']) { background: var(--ept-gold-light); color: var(--ept-gold-dark); }
    :host([data-ton='clos']) { background: var(--ept-error-light); color: var(--ept-error-dark); }
  `,
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
