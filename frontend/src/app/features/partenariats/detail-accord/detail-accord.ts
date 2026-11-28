import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Accord, HistoriqueAccord, LIBELLES_ACTION_ACCORD } from '../../../core/services/models/partenariat.model';
import { AccordsService } from '../../../core/services/partenariats/accords';
import { DecisionAccord } from '../decision-accord/decision-accord';
import { FormulaireAccord } from '../formulaire-accord/formulaire-accord';
import { HistoriqueConventionListe } from '../historique-convention/historique-convention';
import { InfosAccord } from '../infos-accord/infos-accord';
import { PiecesConvention } from '../pieces-convention/pieces-convention';

/**
 * Un accord, vu par l’organisme ou par l’école (`admin`) : réponse, correction ou retrait, résiliation côté école,
 * documents et historique. La page ne fait qu’assembler ; le cadre (fil d’Ariane, titre) vient de la route.
 */
@Component({
  selector: 'app-detail-accord',
  imports: [InfosAccord, DecisionAccord, FormulaireAccord, PiecesConvention, HistoriqueConventionListe],
  templateUrl: './detail-accord.html',
  styleUrl: '../detail-convention/detail-convention.scss',
})
export class DetailAccord implements OnInit {
  private readonly service = inject(AccordsService);

  readonly id = input.required<string>();
  readonly admin = input(false);

  protected readonly libelles = LIBELLES_ACTION_ACCORD;
  protected readonly accord = signal<Accord | null>(null);
  protected readonly historique = signal<HistoriqueAccord[]>([]);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly message = signal<string | null>((inject(Router).getCurrentNavigation()?.extras.state?.['message'] as string | undefined) ?? null);
  protected readonly edition = signal(false);
  /** L’organisme dépose tant que l’accord est proposé ; l’école tant que la proposition n’est pas close. */
  protected readonly ajoutable = computed(() => {
    const statut = this.accord()?.statut;
    if (!statut || statut === 'REFUSE' || statut === 'RETIRE') return false;
    return this.admin() || statut === 'PROPOSE';
  });

  ngOnInit(): void {
    this.service.detail(this.id(), this.admin()).subscribe({
      next: (a) => this.accord.set(a),
      error: (e: HttpErrorResponse) => this.erreurChargement.set(e.status === 404 ? 'Cet accord n’existe pas.' : 'Impossible de charger l’accord.'),
    });
    this.chargerHistorique();
  }

  protected miseAJour(accord: Accord, message: string | null = null): void {
    this.accord.set(accord);
    this.edition.set(false);
    this.message.set(message);
    this.chargerHistorique();
  }

  private chargerHistorique(): void {
    this.service.historique(this.id(), this.admin()).subscribe({ next: (h) => this.historique.set(h), error: () => this.historique.set([]) });
  }
}
