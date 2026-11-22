import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LIBELLES_STATUT_OFFRE_MOBILITE, LIBELLES_TYPE_MOBILITE, OffreMobilite, periodeLisible,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/** Offres de mobilité de l’institut connecté, tous statuts confondus, avec le motif d’un retrait par l’école. */
@Component({
  selector: 'app-mes-offres-mobilite',
  imports: [DatePipe, RouterLink, FilAriane],
  templateUrl: './mes-offres-mobilite.html',
  styleUrl: './mes-offres-mobilite.scss',
})
export class MesOffresMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);

  protected readonly etapes = [{ libelle: 'Accueil', lien: '/accueil' }, { libelle: 'Mes offres de mobilité' }];
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly statuts = LIBELLES_STATUT_OFFRE_MOBILITE;
  protected readonly periode = periodeLisible;
  protected readonly offres = signal<OffreMobilite[] | null>(null);
  protected readonly erreurChargement = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.mesOffres().subscribe({
      next: (offres) => this.offres.set(offres),
      error: () => this.erreurChargement.set(true),
    });
  }
}
