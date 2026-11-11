import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_STATUT_STAGE, LIBELLES_TYPE_STAGE, MonStage } from '../../../core/services/models/stage.model';
import { DeclarationsStageService } from '../../../core/services/stages/declarations';
import { ListeDefinitiveService } from '../../../core/services/stages/liste-definitive';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/**
 * Stages de l’étudiant connecté : confirmés par la liste définitive (STA-04) ou par la validation d’une déclaration,
 * et ses déclarations en attente ou refusées (STA-10), qu’il peut retirer tant qu’elles attendent.
 */
@Component({
  selector: 'app-mes-stages',
  imports: [DatePipe, RouterLink, FilAriane],
  templateUrl: './mes-stages.html',
  styleUrl: './mes-stages.scss',
})
export class MesStages implements OnInit {
  private readonly service = inject(ListeDefinitiveService);
  private readonly declarations = inject(DeclarationsStageService);

  protected readonly etapes = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Mes stages' }];
  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly statuts = LIBELLES_STATUT_STAGE;
  protected readonly stages = signal<readonly MonStage[] | null>(null);
  protected readonly erreur = signal(false);
  protected readonly aRetirer = signal<string | null>(null);
  protected readonly erreurRetrait = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreur.set(false);
    this.service.mesStages().subscribe({
      next: (liste) => this.stages.set(liste),
      error: () => this.erreur.set(true),
    });
  }

  protected retirer(stage: MonStage): void {
    this.erreurRetrait.set(null);
    this.declarations.retirer(stage.id).subscribe({
      next: () => {
        this.aRetirer.set(null);
        this.stages.update((liste) => liste?.filter((s) => s.id !== stage.id) ?? null);
        this.message.set(`Votre déclaration « ${stage.sujet} » est retirée.`);
      },
      error: (erreur: HttpErrorResponse) => this.erreurRetrait.set(erreur.error?.message ?? 'La déclaration n’a pas pu être retirée. Réessayez.'),
    });
  }
}
