import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Accord } from '../../../core/services/models/partenariat.model';
import { FormulaireAccord } from '../../partenariats/formulaire-accord/formulaire-accord';
import { PageAdmin } from '../page-admin/page-admin';

/** Proposition d’un accord par l’école à un organisme, qui l’accepte ou le refuse depuis son espace. */
@Component({
  selector: 'app-proposition-accord-admin',
  imports: [PageAdmin, FormulaireAccord],
  template: `
    <app-page-admin titre="Proposer un accord" [parents]="parents"
      introduction="L’organisme reçoit la proposition et l’accepte ou la refuse depuis son espace.">
      <app-formulaire-accord [administration]="true" (enregistre)="ouvrir($event)" (annule)="retour()" />
    </app-page-admin>
  `,
})
export class PropositionAccordAdmin {
  private readonly router = inject(Router);
  protected readonly parents = [{ libelle: 'Accords de stage et de mobilité', lien: '/admin/partenariats/accords' }];

  protected ouvrir(accord: Accord): void {
    void this.router.navigate(['/admin/partenariats/accords', accord.id], { state: { message: 'La proposition est envoyée à l’organisme.' } });
  }

  protected retour(): void {
    void this.router.navigate(['/admin/partenariats/accords']);
  }
}
