import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { MesSuivis } from '../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../core/services/stages/suivi-stages';
import { FilAriane } from '../../../shared/fil-ariane/fil-ariane';
import { FicheSuivi } from '../fiche-suivi/fiche-suivi';

/**
 * Suivi des stages par un membre (STA-08) : l’encadrant interne voit les stages qu’il encadre, le chef de département
 * ceux de sa filière, l’organisme les stagiaires qu’il accueille.
 */
@Component({
  selector: 'app-suivi-stages-membre',
  imports: [RouterLink, FilAriane, FicheSuivi],
  templateUrl: './suivi-stages.html',
  styleUrl: './suivi-stages.scss',
})
export class SuiviStagesMembre implements OnInit {
  private readonly service = inject(SuiviStagesService);
  private readonly authService = inject(AuthService);

  protected readonly etapes = [{ libelle: 'Stages', lien: '/stages' }, { libelle: 'Suivi des stages' }];
  protected readonly estOrganisme = computed(() => this.authService.utilisateur()?.role === 'ORGANISME');
  protected readonly suivis = signal<MesSuivis | null>(null);
  protected readonly erreur = signal(false);

  ngOnInit(): void {
    this.charger();
  }

  protected charger(): void {
    this.erreur.set(false);
    this.service.mesSuivis().subscribe({ next: (suivis) => this.suivis.set(suivis), error: () => this.erreur.set(true) });
  }
}
