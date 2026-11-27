import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LIBELLES_STATUT_OFFRE_EMPLOI, LIBELLES_TYPE_CONTRAT, OffreEmploi,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { presenterAuteur } from '../auteur-offre';
import { SignalerOffre } from '../signaler-offre/signaler-offre';

/**
 * Détail d’une offre d’emploi (#221). Une offre relayée dit clairement qui l’a relayée et d’où elle vient, et mène à
 * l’annonce d’origine : elle ne laisse jamais croire que l’entreprise est partenaire de l’EPT.
 */
@Component({
  selector: 'app-detail-offre-emploi',
  imports: [DatePipe, RouterLink, BoutonRetour, SignalerOffre],
  templateUrl: './detail-offre-emploi.html',
  styleUrl: './detail-offre-emploi.scss',
})
export class DetailOffreEmploi implements OnInit {
  private readonly service = inject(OffresEmploiService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly offre = signal<OffreEmploi | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly types = LIBELLES_TYPE_CONTRAT;
  protected readonly statuts = LIBELLES_STATUT_OFFRE_EMPLOI;
  protected readonly auteur = computed(() => {
    const offre = this.offre();
    return offre ? presenterAuteur(offre.auteur) : '';
  });
  protected readonly confirmerRetrait = signal(false);
  protected readonly retraitEnCours = signal(false);
  protected readonly erreurRetrait = signal<string | null>(null);

  ngOnInit(): void {
    this.service.detail(this.id).subscribe({
      next: (offre) => this.offre.set(offre),
      error: (erreur: HttpErrorResponse) => this.erreur.set(erreur.status === 404
        ? 'Cette offre n’existe pas ou n’est plus publiée.'
        : erreur.error?.message ?? 'Impossible de charger l’offre.'),
    });
  }

  protected retirer(): void {
    this.retraitEnCours.set(true);
    this.erreurRetrait.set(null);
    this.service.retirer(this.id).subscribe({
      next: (offre) => {
        this.offre.set(offre);
        this.confirmerRetrait.set(false);
        this.retraitEnCours.set(false);
      },
      error: (erreur: HttpErrorResponse) => {
        this.retraitEnCours.set(false);
        this.erreurRetrait.set(erreur.error?.message ?? 'Le retrait a échoué. Réessayez.');
      },
    });
  }
}
