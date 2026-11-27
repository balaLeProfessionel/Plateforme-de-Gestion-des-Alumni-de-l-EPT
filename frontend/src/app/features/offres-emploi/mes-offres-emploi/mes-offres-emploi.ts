import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { LIBELLES_STATUT_OFFRE_EMPLOI, LIBELLES_TYPE_CONTRAT, OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';

/**
 * Offres du compte connecté, tous statuts confondus : modification, prolongation, retrait. Un membre y retrouve ses offres
 * relayées (#221), un organisme les offres qu’il a publiées (#222).
 */
@Component({
  selector: 'app-mes-offres-emploi',
  imports: [DatePipe, RouterLink, BoutonRetour],
  templateUrl: './mes-offres-emploi.html',
  styleUrl: './mes-offres-emploi.scss',
})
export class MesOffresEmploi implements OnInit {
  private readonly service = inject(OffresEmploiService);
  private readonly authService = inject(AuthService);
  /** Un organisme publie des offres gérées ; les autres rôles relaient. */
  protected readonly organisme = computed(() => this.authService.utilisateur()?.role === 'ORGANISME');

  protected readonly types = LIBELLES_TYPE_CONTRAT;
  protected readonly statuts = LIBELLES_STATUT_OFFRE_EMPLOI;
  protected readonly offres = signal<readonly OffreEmploi[] | null>(null);
  protected readonly erreurChargement = signal(false);
  /** Offre dont le retrait attend une confirmation. */
  protected readonly aRetirer = signal<string | null>(null);
  protected readonly erreurRetrait = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected libelleStatut(offre: OffreEmploi): string {
    if (offre.statut !== 'PUBLIEE') return this.statuts[offre.statut];
    if (offre.cloturee) return 'Recrutement clôturé';
    return offre.expiree ? 'Expirée' : this.statuts.PUBLIEE;
  }

  ngOnInit(): void {
    this.charger();
  }

  /** Nom accessible du lien : reprend le texte visible (« Candidatures »), puis le titre et les nombres. */
  protected libelleCandidatures(offre: OffreEmploi): string {
    const n = offre.candidatures;
    const detail = n ? ` : ${n.total}${n.aTraiter ? `, dont ${n.aTraiter} à traiter` : ''}` : '';
    return `Candidatures reçues pour ${offre.titre}${detail}`;
  }

  protected charger(): void {
    this.erreurChargement.set(false);
    this.service.mesOffres().subscribe({
      next: (offres) => this.offres.set(offres),
      error: () => this.erreurChargement.set(true),
    });
  }

  protected demanderRetrait(id: string): void {
    this.erreurRetrait.set(null);
    this.aRetirer.set(id);
  }

  protected retirer(offre: OffreEmploi): void {
    this.erreurRetrait.set(null);
    this.service.retirer(offre.id).subscribe({
      next: (retiree) => {
        this.aRetirer.set(null);
        this.offres.update((liste) => liste?.map((o) => o.id === retiree.id ? retiree : o) ?? null);
        this.message.set(`« ${retiree.titre} » est retirée : les membres ne la voient plus.`);
      },
      error: (erreur: HttpErrorResponse) => this.erreurRetrait.set(erreur.error?.message ?? 'Le retrait a échoué. Réessayez.'),
    });
  }
}
