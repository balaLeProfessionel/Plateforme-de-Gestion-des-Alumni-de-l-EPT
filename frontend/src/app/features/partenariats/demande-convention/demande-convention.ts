import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Convention } from '../../../core/services/models/partenariat.model';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { FormulaireDemandeConvention } from '../formulaire-demande-convention/formulaire-demande-convention';

/** Dépôt d’une demande de convention par l’organisme ; une fois envoyée, on suit la demande sur sa page. */
@Component({
  selector: 'app-demande-convention',
  imports: [FilAriane, FormulaireDemandeConvention],
  template: `
    <div class="page-stages">
      <app-fil-ariane [etapes]="etapes" />
      <header class="entete">
        <h1>Demander une convention de partenariat</h1>
        <p class="introduction">Le service des Relations extérieures de l’EPT examine votre demande et vous tient informé à chaque étape.
          Vous pourrez joindre des documents une fois la demande envoyée.</p>
      </header>
      <app-formulaire-demande-convention (enregistree)="ouvrir($event)" (annulee)="retour()" />
    </div>
  `,
  styleUrl: './demande-convention.scss',
})
export class DemandeConvention {
  private readonly router = inject(Router);
  protected readonly etapes = [{ libelle: 'Partenariat avec l’EPT', lien: '/partenariats' }, { libelle: 'Nouvelle demande' }];

  protected ouvrir(convention: Convention): void {
    void this.router.navigate(['/partenariats/conventions', convention.id], { state: { message: 'Votre demande est envoyée à l’EPT.' } });
  }

  protected retour(): void {
    void this.router.navigate(['/partenariats']);
  }
}
