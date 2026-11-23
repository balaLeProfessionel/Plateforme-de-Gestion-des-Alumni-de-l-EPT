import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_CLASSE } from '../../../core/services/models/classe.model';
import {
  DEFINITIONS_TYPE_MOBILITE, LIBELLES_PIECE, LIBELLES_PUBLIC_VISE, LIBELLES_STATUT_OFFRE_MOBILITE, LIBELLES_TYPE_MOBILITE, OffreMobilite, periodeLisible,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { CandidatureOffreMobilite } from '../candidature-offre-mobilite/candidature-offre-mobilite';
import { FichiersOffreMobilite } from '../fichiers-offre-mobilite/fichiers-offre-mobilite';

/** Détail d’une offre de mobilité : conditions, pièces demandées, documents ; modification et clôture pour qui la gère. */
@Component({
  selector: 'app-detail-offre-mobilite',
  imports: [DatePipe, RouterLink, BoutonRetour, FichiersOffreMobilite, CandidatureOffreMobilite],
  templateUrl: './detail-offre-mobilite.html',
  styleUrl: './detail-offre-mobilite.scss',
})
export class DetailOffreMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);
  private readonly authService = inject(AuthService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly offre = signal<OffreMobilite | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmerCloture = signal(false);
  protected readonly erreurAction = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly types = LIBELLES_TYPE_MOBILITE;
  protected readonly definitions = DEFINITIONS_TYPE_MOBILITE;
  protected readonly publics = LIBELLES_PUBLIC_VISE;
  protected readonly statuts = LIBELLES_STATUT_OFFRE_MOBILITE;
  protected readonly pieces = LIBELLES_PIECE;
  protected readonly classes = LIBELLES_CLASSE;
  protected readonly periode = periodeLisible;
  /** L’institut revient à ses offres, le chef à l’administration, un candidat à la liste. */
  protected readonly secours = computed(() => {
    const role = this.authService.utilisateur()?.role;
    if (role === 'ORGANISME') return '/mobilites/mes-offres';
    return this.authService.aPermission('GERER_MOBILITES') ? '/admin/mobilites/offres' : '/mobilites';
  });

  ngOnInit(): void {
    this.service.detail(this.id).subscribe({
      next: (offre) => this.offre.set(offre),
      error: (erreur: HttpErrorResponse) => this.erreur.set(erreur.status === 404
        ? 'Cette offre n’existe pas ou n’est plus visible.'
        : erreur.error?.message ?? 'Impossible de charger l’offre.'),
    });
  }

  protected cloturer(): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreurAction.set(null);
    this.service.cloturer(this.id).subscribe({
      next: (offre) => {
        this.enCours.set(false);
        this.confirmerCloture.set(false);
        this.offre.set(offre);
        this.message.set('L’offre est close : elle ne reçoit plus de candidatures.');
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreurAction.set(erreur.error?.message ?? 'La clôture a échoué. Réessayez.');
      },
    });
  }
}
