import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_STATUT_OFFRE, LIBELLES_TYPE_STAGE, OffreStage } from '../../../core/services/models/stage.model';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { FichiersOffre } from '../fichiers-offre/fichiers-offre';

/** Détail d’une offre de stage (STA-02). Seul un étudiant pourra postuler (STA-03, tranche suivante). */
@Component({
  selector: 'app-detail-offre',
  imports: [DatePipe, RouterLink, BoutonRetour, FichiersOffre],
  templateUrl: './detail-offre.html',
  styleUrl: './detail-offre.scss',
})
export class DetailOffre implements OnInit {
  private readonly service = inject(OffresStageService);
  private readonly authService = inject(AuthService);

  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly offre = signal<OffreStage | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly statuts = LIBELLES_STATUT_OFFRE;
  protected readonly estEtudiant = computed(() => this.authService.utilisateur()?.role === 'ETUDIANT');

  ngOnInit(): void {
    this.service.detail(this.id).subscribe({
      next: (offre) => this.offre.set(offre),
      error: (erreur: HttpErrorResponse) => this.erreur.set(erreur.status === 404
        ? 'Cette offre n’existe pas ou n’est plus publiée.'
        : erreur.error?.message ?? 'Impossible de charger l’offre.'),
    });
  }
}
