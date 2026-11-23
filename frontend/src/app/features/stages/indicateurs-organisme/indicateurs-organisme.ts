import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IndicateursOrganisme, LIBELLES_TYPE_STAGE, TypeStage } from '../../../core/services/models/stage.model';
import { ListeDefinitiveService } from '../../../core/services/stages/liste-definitive';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/**
 * Indicateurs de la collaboration de l’organisme avec l’école (STA-13) : offres publiées et candidatures reçues par
 * année, étudiants accueillis par type de stage et par filière. Tableaux simples, lisibles au lecteur d’écran.
 */
@Component({
  selector: 'app-indicateurs-organisme',
  imports: [RouterLink, FilAriane],
  templateUrl: './indicateurs-organisme.html',
  styleUrl: './indicateurs-organisme.scss',
})
export class IndicateursOrganismePage {
  private readonly service = inject(ListeDefinitiveService);

  protected readonly etapes = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Mes indicateurs' }];
  protected readonly indicateurs = signal<IndicateursOrganisme | null>(null);
  protected readonly erreur = signal(false);

  constructor() {
    this.charger();
  }

  protected charger(): void {
    this.erreur.set(false);
    this.service.mesIndicateurs().subscribe({ next: (i) => this.indicateurs.set(i), error: () => this.erreur.set(true) });
  }

  protected libelleType(cle: string): string {
    return LIBELLES_TYPE_STAGE[cle as TypeStage] ?? cle;
  }

  /** Part de la plus grande valeur, pour la barre de chaque ligne. */
  protected part(nombre: number, liste: readonly { nombre: number }[]): number {
    const max = Math.max(...liste.map((l) => l.nombre), 1);
    return Math.round((nombre / max) * 100);
  }
}
