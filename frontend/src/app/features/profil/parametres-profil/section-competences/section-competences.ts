import { Component, inject, signal } from '@angular/core';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { CompetencesLangues } from '../../../../core/services/models/competences.model';
import { MessageSection } from '../../composants/message-section.model';
import { CompetencesLanguesEditeur } from '../../composants/competences-langues/competences-langues';

// Competences et langues dans les parametres : charge, propose, enregistre.
@Component({
  selector: 'app-section-competences',
  imports: [CompetencesLanguesEditeur],
  template: `
    <app-competences-langues [valeur]="valeur()" [suggestions]="suggestions()" [enSauvegarde]="enSauvegarde()"
      [message]="message()" (rechercher)="rechercher($event)" (sauvegarder)="enregistrer($event)" />
  `
})
export class SectionCompetences {
  private readonly profilService = inject(ProfilService);

  protected readonly valeur = signal<CompetencesLangues | null>(null);
  protected readonly suggestions = signal<string[]>([]);
  protected readonly enSauvegarde = signal(false);
  protected readonly message = signal<MessageSection | null>(null);

  constructor() {
    this.profilService.lireCompetencesLangues().subscribe({
      next: (valeur) => this.valeur.set(valeur),
      error: () => this.message.set({ type: 'erreur', texte: 'Impossible de charger vos compétences et langues.' })
    });
  }

  protected rechercher(texte: string): void {
    this.profilService.suggererCompetences(texte).subscribe({
      next: (resultats) => this.suggestions.set(resultats.map((r) => r.libelle)),
      error: () => this.suggestions.set([])
    });
  }

  protected enregistrer(donnees: CompetencesLangues): void {
    this.enSauvegarde.set(true);
    this.message.set(null);
    this.profilService.remplacerCompetencesLangues(donnees).subscribe({
      next: (valeur) => {
        this.valeur.set(valeur);
        this.enSauvegarde.set(false);
        this.message.set({ type: 'succes', texte: 'Compétences et langues enregistrées.' });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enSauvegarde.set(false);
        this.message.set({ type: 'erreur', texte: err?.error?.message ?? 'Échec de l’enregistrement.' });
      }
    });
  }
}
