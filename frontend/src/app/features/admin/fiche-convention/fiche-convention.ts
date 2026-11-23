import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Convention, HistoriqueConvention, STATUTS_EN_COURS } from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { HistoriqueConventionListe } from '../../partenariats/historique-convention/historique-convention';
import { InfosConvention } from '../../partenariats/infos-convention/infos-convention';
import { PiecesConvention } from '../../partenariats/pieces-convention/pieces-convention';
import { ResiliationConvention } from '../../partenariats/resiliation-convention/resiliation-convention';
import { ActionsConvention } from '../actions-convention/actions-convention';
import { PageAdmin } from '../page-admin/page-admin';

/** Fiche d’une convention pour le service des Relations extérieures : décisions, documents et historique. */
@Component({
  selector: 'app-fiche-convention',
  imports: [PageAdmin, InfosConvention, PiecesConvention, HistoriqueConventionListe, ActionsConvention, ResiliationConvention],
  templateUrl: './fiche-convention.html',
  styleUrls: ['../formulaire-admin.scss', '../etats-admin.scss'],
})
export class FicheConvention implements OnInit {
  private readonly service = inject(ConventionsPartenariatService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly parents = [{ libelle: 'Conventions de partenariat', lien: '/admin/partenariats/conventions' }];
  protected readonly convention = signal<Convention | null>(null);
  protected readonly historique = signal<HistoriqueConvention[]>([]);
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>((inject(Router).getCurrentNavigation()?.extras.state?.['message'] as string | undefined) ?? null);

  ngOnInit(): void {
    this.service.detail(this.id, true).subscribe({
      next: (c) => this.convention.set(c),
      error: (e: HttpErrorResponse) => this.erreur.set(e.status === 404 ? 'Cette convention n’existe pas.' : 'Impossible de charger la convention.'),
    });
    this.chargerHistorique();
  }

  /** Le service dépose des documents tant que la convention n’est pas refusée ou annulée. */
  protected ajoutable(c: Convention): boolean {
    return STATUTS_EN_COURS.includes(c.statut) || ['ACTIVE', 'EXPIREE', 'RESILIEE'].includes(c.statut);
  }

  protected miseAJour(convention: Convention, message: string | null = null): void {
    this.convention.set(convention);
    this.message.set(message);
    this.chargerHistorique();
  }

  private chargerHistorique(): void {
    this.service.historique(this.id, true).subscribe({ next: (h) => this.historique.set(h), error: () => this.historique.set([]) });
  }
}
