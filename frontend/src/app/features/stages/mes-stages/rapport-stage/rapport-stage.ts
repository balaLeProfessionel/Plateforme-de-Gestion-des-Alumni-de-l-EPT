import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, linkedSignal, signal } from '@angular/core';
import { MonStage, POIDS_MAX_PIECE, Rapport } from '../../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../../core/services/stages/suivi-stages';
import { enregistrerFichier } from '../../../../shared/telecharger';

/**
 * Rapport d’un stage confirmé, côté étudiant (STA-07) : date limite fixée par l’école, dépôt du PDF, remplaçable
 * jusqu’à cette date incluse, puis dépôt fermé.
 */
@Component({
  selector: 'app-rapport-stage',
  imports: [DatePipe],
  templateUrl: './rapport-stage.html',
  styleUrl: './rapport-stage.scss',
})
export class RapportStage {
  readonly stage = input.required<MonStage>();

  private readonly service = inject(SuiviStagesService);
  private readonly document = inject(DOCUMENT);
  protected readonly rapport = linkedSignal<Rapport | null>(() => this.stage().rapport);
  protected readonly enCours = signal(false);
  protected readonly message = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected deposer(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0] ?? null;
    champ.value = '';
    this.erreur.set(null);
    this.message.set(null);
    if (!fichier) return;
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      this.erreur.set('Votre rapport doit être un fichier PDF.');
      return;
    }
    if (fichier.size > POIDS_MAX_PIECE) {
      this.erreur.set('Votre rapport ne doit pas dépasser 5 Mo.');
      return;
    }
    const remplacement = this.rapport()?.etat === 'DEPOSE';
    this.enCours.set(true);
    this.service.deposerRapport(this.stage().id, fichier).subscribe({
      next: (rapport) => {
        this.enCours.set(false);
        this.rapport.set(rapport);
        this.message.set(remplacement ? 'Votre rapport a été remplacé.' : 'Votre rapport a été déposé.');
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'Le dépôt n’a pas abouti. Réessayez.');
      },
    });
  }

  protected telecharger(nom: string): void {
    this.service.telechargerRapport(this.stage().id, false).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, nom),
      error: () => this.erreur.set('Le rapport n’a pas pu être téléchargé. Réessayez.'),
    });
  }
}
