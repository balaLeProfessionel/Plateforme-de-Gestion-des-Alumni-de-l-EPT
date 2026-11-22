import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { PersonnelSuggestion, SuiviStage } from '../../../../core/services/models/stage.model';
import { SuiviStagesService } from '../../../../core/services/stages/suivi-stages';

type Mode = 'lecture' | 'encadrant' | 'tuteur';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Actions de l’administrateur Stages sur un stage suivi : désigner l’encadrant interne, corriger le maître de stage. */
@Component({
  selector: 'app-actions-suivi',
  imports: [RouterLink],
  templateUrl: './actions-suivi.html',
  styleUrls: ['../../formulaire-admin.scss', './actions-suivi.scss'],
})
export class ActionsSuivi {
  private readonly service = inject(SuiviStagesService);

  readonly stage = input.required<SuiviStage>();
  readonly modifie = output<{ stage: SuiviStage; message: string }>();

  protected readonly mode = signal<Mode>('lecture');
  protected readonly recherche = signal('');
  protected readonly suggestions = signal<readonly PersonnelSuggestion[] | null>(null);
  protected readonly tuteur = signal({ nom: '', fonction: '', email: '', telephone: '' });
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  private readonly saisies = new Subject<string>();

  constructor() {
    this.saisies.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((texte) => texte.length < 2 ? of(null) : this.service.suggererPersonnel(texte).pipe(catchError(() => of([])))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  protected ouvrir(mode: Mode): void {
    const s = this.stage();
    this.erreur.set(null);
    this.recherche.set('');
    this.suggestions.set(null);
    this.tuteur.set({ nom: s.tuteurNom ?? '', fonction: s.tuteurFonction ?? '', email: s.tuteurEmail ?? '', telephone: s.tuteurTelephone ?? '' });
    this.mode.set(mode);
  }

  protected chercher(evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value;
    this.recherche.set(valeur);
    this.saisies.next(valeur.trim());
  }

  protected saisirTuteur(champ: 'nom' | 'fonction' | 'email' | 'telephone', evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value;
    this.tuteur.update((t) => ({ ...t, [champ]: valeur }));
  }

  protected designer(personne: PersonnelSuggestion | null): void {
    const nom = personne ? `${personne.prenom} ${personne.nom}` : null;
    this.executer(this.service.designerEncadrant(this.stage().id, personne?.id ?? null),
      nom ? `${nom} encadre le stage de ${this.etudiant()}. Ils en sont prévenus par e-mail.` : `Le stage de ${this.etudiant()} n’a plus d’encadrant.`);
  }

  protected enregistrerTuteur(): void {
    const t = this.tuteur();
    if (!t.nom.trim()) {
      this.erreur.set('Le nom du maître de stage est obligatoire.');
      return;
    }
    if (t.email.trim() && !EMAIL.test(t.email.trim())) {
      this.erreur.set('L’adresse e-mail du maître de stage n’est pas valide.');
      return;
    }
    const texte = (valeur: string) => valeur.trim() || null;
    this.executer(this.service.modifierTuteur(this.stage().id, {
      nom: t.nom.trim(), fonction: texte(t.fonction), email: texte(t.email), telephone: texte(t.telephone),
    }), `Le maître de stage de ${this.etudiant()} est à jour.`);
  }

  private etudiant(): string {
    return `${this.stage().etudiant.prenom} ${this.stage().etudiant.nom}`;
  }

  private executer(requete: ReturnType<SuiviStagesService['modifierTuteur']>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (stage) => {
        this.enCours.set(false);
        this.mode.set('lecture');
        this.modifie.emit({ stage, message });
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
