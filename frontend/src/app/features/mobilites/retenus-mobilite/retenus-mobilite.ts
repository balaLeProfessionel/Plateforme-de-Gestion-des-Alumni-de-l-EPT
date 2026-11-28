import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DossierMobilite } from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { PiecesDossier } from '../dossiers-mobilite/pieces-dossier';

/** Candidats retenus par l’école sur une offre de l’institut, avec leur dossier, une fois la liste publiée. */
@Component({
  selector: 'app-retenus-mobilite',
  imports: [RouterLink, BoutonRetour, PiecesDossier],
  templateUrl: './retenus-mobilite.html',
  styleUrl: '../mes-offres-mobilite/mes-offres-mobilite.scss',
})
export class RetenusMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);
  protected readonly offreId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly retenus = signal<DossierMobilite[] | null>(null);
  protected readonly erreur = signal(false);

  ngOnInit(): void {
    this.service.retenus(this.offreId).subscribe({
      next: (liste) => this.retenus.set(liste),
      error: () => this.erreur.set(true),
    });
  }
}
