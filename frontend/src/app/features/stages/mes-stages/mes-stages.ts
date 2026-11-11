import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_TYPE_STAGE, MonStage } from '../../../core/services/models/stage.model';
import { ListeDefinitiveService } from '../../../core/services/stages/liste-definitive';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/** Stages confirmés de l’étudiant connecté : liste définitive publiée par l’école (STA-04). */
@Component({
  selector: 'app-mes-stages',
  imports: [DatePipe, RouterLink, FilAriane],
  templateUrl: './mes-stages.html',
  styleUrl: './mes-stages.scss',
})
export class MesStages implements OnInit {
  private readonly service = inject(ListeDefinitiveService);

  protected readonly etapes = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Mes stages' }];
  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly stages = signal<readonly MonStage[] | null>(null);
  protected readonly erreur = signal(false);

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
}
