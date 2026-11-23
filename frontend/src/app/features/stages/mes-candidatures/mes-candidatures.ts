import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LIBELLES_RESULTAT, LIBELLES_STATUT_CANDIDATURE, MaCandidature } from '../../../core/services/models/stage.model';
import { CandidaturesService } from '../../../core/services/stages/candidatures';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';

/** Candidatures de l’étudiant connecté et leur état (STA-03), puis le résultat de la liste définitive (STA-04). */
@Component({
  selector: 'app-mes-candidatures',
  imports: [DatePipe, RouterLink, FilAriane],
  templateUrl: './mes-candidatures.html',
  styleUrl: './mes-candidatures.scss',
})
export class MesCandidatures implements OnInit {
  private readonly service = inject(CandidaturesService);

  protected readonly etapes = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Mes candidatures' }];
  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE;
  protected readonly resultats = LIBELLES_RESULTAT;
  protected readonly candidatures = signal<readonly MaCandidature[] | null>(null);
  protected readonly erreur = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreur.set(false);
    this.service.mesCandidatures().subscribe({
      next: (liste) => this.candidatures.set(liste),
      error: () => this.erreur.set(true),
    });
  }
}
