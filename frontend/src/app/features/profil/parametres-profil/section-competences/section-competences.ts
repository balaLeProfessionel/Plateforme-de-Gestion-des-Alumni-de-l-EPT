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
    @if (charge()) {
      <app-competences-langues [valeur]="valeur()" [suggestions]="suggestions()" [enSauvegarde]="enSauvegarde()"
        [message]="message()" [boutonSiModifie]="true" (rechercher)="rechercher($event)" (sauvegarder)="enregistrer($event)" />
    } @else {
      <p class="chargement" role="status">Chargement de vos compétences…</p>
    }
  `
})
export class SectionCompetences {
  private readonly profilService = inject(ProfilService);

  protected readonly valeur = signal<CompetencesLangues | null>(null);
  // Modifiable seulement une fois chargee : son arrivee effacerait une saisie deja commencee
  protected readonly charge = signal(false);
  protected readonly suggestions = signal<string[]>([]);
  protected readonly enSauvegarde = signal(false);
  protected readonly message = signal<MessageSection | null>(null);

  constructor() {
    this.profilService.lireCompetencesLangues().subscribe({
      next: (valeur) => {
        this.valeur.set(valeur);
        this.charge.set(true);
      },
      error: () => {
        this.message.set({ type: 'erreur', texte: 'Impossible de charger vos compétences et langues.' });
        this.charge.set(true);
      }
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
