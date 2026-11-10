import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_STATUT_OFFRE, LIBELLES_TYPE_STAGE, OffreStage } from '../../../core/services/models/stage.model';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/** Offres de l’organisme connecté, tous statuts confondus, avec le motif de l’école et le retrait (STA-01). */
@Component({
  selector: 'app-mes-offres',
  imports: [DatePipe, RouterLink, FilAriane],
  templateUrl: './mes-offres.html',
  styleUrl: './mes-offres.scss',
})
export class MesOffres implements OnInit {
  private readonly service = inject(OffresStageService);

  protected readonly etapes = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Mes offres' }];
  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly statuts = LIBELLES_STATUT_OFFRE;
  protected readonly offres = signal<readonly OffreStage[] | null>(null);
  protected readonly erreurChargement = signal(false);
  /** Offre dont le retrait attend une confirmation. */
  protected readonly aRetirer = signal<string | null>(null);
  protected readonly erreurRetrait = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

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

  protected retirer(offre: OffreStage): void {
    this.erreurRetrait.set(null);
    this.service.retirerMienne(offre.id).subscribe({
      next: (retiree) => {
        this.aRetirer.set(null);
        this.offres.update((liste) => liste?.map((o) => o.id === retiree.id ? retiree : o) ?? null);
        this.message.set(`« ${retiree.titre} » est retirée : les étudiants ne la voient plus.`);
      },
      error: (erreur: HttpErrorResponse) => this.erreurRetrait.set(erreur.error?.message ?? 'Le retrait a échoué. Réessayez.'),
    });
  }
}
