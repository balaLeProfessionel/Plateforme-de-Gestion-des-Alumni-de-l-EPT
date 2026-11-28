import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Accord } from '../../../core/services/models/partenariat.model';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { FormulaireAccord } from '../formulaire-accord/formulaire-accord';

/** Proposition d’un accord par l’organisme ; l’EPT l’accepte ou la refuse. */
@Component({
  selector: 'app-proposition-accord',
  imports: [FilAriane, FormulaireAccord],
  template: `
    <div class="page-stages">
      <app-fil-ariane [etapes]="etapes" />
      <header class="entete">
        <h1>Proposer un accord à l’EPT</h1>
        <p class="introduction">Précisez l’accueil de stagiaires ou les échanges d’étudiants que vous proposez. Le service des Relations
          extérieures l’accepte ou le refuse ; vous pourrez joindre des documents une fois la proposition envoyée.</p>
      </header>
      <app-formulaire-accord (enregistre)="ouvrir($event)" (annule)="retour()" />
    </div>
  `,
  styleUrl: '../demande-convention/demande-convention.scss',
})
export class PropositionAccord {
  private readonly router = inject(Router);
  protected readonly etapes = [{ libelle: 'Partenariat avec l’EPT', lien: '/partenariats' }, { libelle: 'Proposer un accord' }];

  protected ouvrir(accord: Accord): void {
    void this.router.navigate(['/partenariats/accords', accord.id], { state: { message: 'Votre proposition est envoyée à l’EPT.' } });
  }

  protected retour(): void {
    void this.router.navigate(['/partenariats']);
  }
}
