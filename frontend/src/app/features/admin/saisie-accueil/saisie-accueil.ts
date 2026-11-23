import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Mobilite } from '../../../core/services/models/mobilite.model';
import { FormulaireAccueil } from '../../mobilites/formulaire-accueil/formulaire-accueil';
import { PageAdmin } from '../page-admin/page-admin';

/** Saisie d’une mobilité entrante par le chef du service mobilité, au nom d’un établissement existant ou nouveau. */
@Component({
  selector: 'app-saisie-accueil',
  imports: [PageAdmin, FormulaireAccueil],
  template: `
    <app-page-admin titre="Saisir une mobilité entrante" [parents]="parents"
      introduction="L’étudiant accueilli n’a pas de compte : indiquez son identité, son programme et sa filière d’accueil.">
      <app-formulaire-accueil [administration]="true" (enregistree)="ouvrir($event)" (annulee)="retour()" />
    </app-page-admin>
  `,
})
export class SaisieAccueil {
  private readonly router = inject(Router);
  protected readonly parents = [{ libelle: 'Suivi des mobilités', lien: '/admin/mobilites/suivi' }];

  protected ouvrir(m: Mobilite): void {
    void this.router.navigate(['/admin/mobilites/suivi', m.id]);
  }

  protected retour(): void {
    void this.router.navigate(['/admin/mobilites/suivi']);
  }
}
