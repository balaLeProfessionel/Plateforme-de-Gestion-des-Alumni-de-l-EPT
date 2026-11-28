import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LIBELLES_MOTIF_A_TRAITER, LIBELLES_TYPE_ORGANISME, TableauPartenariats as Tableau,
} from '../../../core/services/models/partenariat.model';
import { IndicateursPartenariatsService } from '../../../core/services/partenariats/indicateurs-partenariats';
import { PageAdmin } from '../page-admin/page-admin';

/**
 * Tableau de bord du service des Relations extérieures : ce qui attend une action, chiffres clés, partenaires par
 * type d’organisme et activité des cinq dernières années civiles.
 */
@Component({
  selector: 'app-tableau-partenariats',
  imports: [DatePipe, RouterLink, PageAdmin],
  templateUrl: './tableau-partenariats.html',
  styleUrls: ['../etats-admin.scss', '../tableau-de-bord/tableau-de-bord.scss', './tableau-partenariats.scss'],
})
export class TableauPartenariats implements OnInit {
  private readonly service = inject(IndicateursPartenariatsService);

  protected readonly motifs = LIBELLES_MOTIF_A_TRAITER;
  protected readonly typesOrganisme = LIBELLES_TYPE_ORGANISME;
  protected readonly tableau = signal<Tableau | null>(null);
  protected readonly erreur = signal(false);
  /** La plus grande barre occupe toute la largeur. */
  protected readonly maximumType = computed(() => Math.max(1, ...(this.tableau()?.partenairesParType.map((r) => r.nombre) ?? [])));

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreur.set(false);
    this.service.tableau().subscribe({ next: (t) => this.tableau.set(t), error: () => this.erreur.set(true) });
  }
}
