import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { BrouillonCv } from '../../../../core/services/import-cv/brouillon-cv';
import { CompetencesLangues } from '../../../../core/services/models/competences.model';
import { MessageSection } from '../../composants/message-section.model';
import {
  CompetencesLanguesCv,
  CompetencesLanguesEditeur
} from '../../composants/competences-langues/competences-langues';
import { NavigationEtapes } from '../../composants/navigation-etapes/navigation-etapes';

// Etape 4, la derniere : competences et langues. En la terminant, le membre
// a relu tout ce qui venait de son CV : le brouillon est alors efface.
@Component({
  selector: 'app-etape-competences',
  imports: [CompetencesLanguesEditeur, NavigationEtapes],
  templateUrl: './etape-competences.html',
  styleUrl: './etape-competences.scss'
})
export class EtapeCompetences {
  private readonly profilService = inject(ProfilService);
  private readonly brouillonCv = inject(BrouillonCv);
  private readonly router = inject(Router);

  private readonly editeur = viewChild(CompetencesLanguesEditeur);

  protected readonly valeur = signal<CompetencesLangues | null>(null);
  protected readonly charge = signal(false);
  protected readonly suggestions = signal<string[]>([]);
  protected readonly enSauvegarde = signal(false);
  protected readonly message = signal<MessageSection | null>(null);

  protected readonly prerempli = computed<CompetencesLanguesCv | null>(() => {
    const profil = this.brouillonCv.profil();
    return profil ? { competences: profil.competences, langues: profil.langues } : null;
  });

  constructor() {
    // Meme precaution que l'etape des informations : pas de saisie avant la fin du chargement.
    forkJoin([
      this.profilService.lireCompetencesLangues().pipe(
        tap((valeur) => this.valeur.set(valeur)),
        catchError(() => {
          this.message.set({ type: 'erreur', texte: 'Impossible de charger vos compétences et langues.' });
          return of(null);
        })
      ),
      this.brouillonCv.charger()
    ]).subscribe(() => this.charge.set(true));
  }

  protected rechercher(texte: string): void {
    this.profilService.suggererCompetences(texte).subscribe({
      next: (resultats) => this.suggestions.set(resultats.map((r) => r.libelle)),
      error: () => this.suggestions.set([])
    });
  }

  protected terminer(): void {
    this.editeur()?.valider();
  }

  protected enregistrer(donnees: CompetencesLangues): void {
    this.enSauvegarde.set(true);
    this.message.set(null);
    this.profilService
      .remplacerCompetencesLangues(donnees)
      .pipe(switchMap(() => this.brouillonCv.valider()))
      .subscribe({
        next: () => this.allerALAccueil(),
        error: (err: { error?: { message?: string } }) => {
          this.enSauvegarde.set(false);
          this.message.set({ type: 'erreur', texte: err?.error?.message ?? "Échec de l'enregistrement." });
        }
      });
  }

  protected passer(): void {
    this.brouillonCv.valider().subscribe(() => this.allerALAccueil());
  }

  private allerALAccueil(): void {
    this.router.navigate(['/accueil']);
  }
}
