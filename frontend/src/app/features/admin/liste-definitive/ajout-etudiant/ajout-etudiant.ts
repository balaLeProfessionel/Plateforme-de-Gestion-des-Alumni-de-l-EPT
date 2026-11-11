import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { FilieresService } from '../../../../core/services/filieres/filieres';
import { Classe, CLASSES_PAR_CYCLE, LIBELLES_CLASSE, libelleClasse } from '../../../../core/services/models/classe.model';
import { CritereEtudiants, EtudiantSuggestion, ListeDefinitive } from '../../../../core/services/models/stage.model';
import { ListeDefinitiveService } from '../../../../core/services/stages/liste-definitive';
import { AvatarMembre } from '../../../../shared/images/avatar-membre';

const AUCUN: CritereEtudiants = { texte: '', classe: '', filiere: '' };

/**
 * Ajout à la liste d’un étudiant qui n’a pas forcément postulé (STA-04) : recherche parmi les étudiants actifs par
 * nom, classe et filière, combinables. Le nom est appliqué après 300 ms, la classe et la filière tout de suite.
 */
@Component({
  selector: 'app-ajout-etudiant',
  imports: [AvatarMembre],
  templateUrl: './ajout-etudiant.html',
  styleUrls: ['../../formulaire-admin.scss', './ajout-etudiant.scss'],
})
export class AjoutEtudiant {
  private readonly service = inject(ListeDefinitiveService);

  readonly offreId = input.required<string>();
  /** Étudiants déjà sur la liste (brouillon ou confirmés) : ils ne sont pas proposés. */
  readonly exclus = input<ReadonlySet<string>>(new Set());
  readonly ajoute = output<ListeDefinitive>();

  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly classesParCycle = CLASSES_PAR_CYCLE;
  protected readonly libellesClasse = LIBELLES_CLASSE;
  protected readonly libelleClasse = libelleClasse;
  protected readonly criteres = signal<CritereEtudiants>(AUCUN);
  protected readonly suggestions = signal<readonly EtudiantSuggestion[] | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal<string | null>(null);
  private readonly recherches = new Subject<{ criteres: CritereEtudiants; delai: number }>();

  constructor() {
    this.recherches.pipe(
      switchMap(({ criteres, delai }) => of(criteres).pipe(debounceTime(delai))),
      distinctUntilChanged((a, b) => a.texte.trim() === b.texte.trim() && a.classe === b.classe && a.filiere === b.filiere),
      switchMap((criteres) => !this.recherchable(criteres) ? of(null)
        : this.service.suggererEtudiants(criteres).pipe(catchError(() => {
          this.erreur.set('La recherche n’a pas abouti. Réessayez.');
          return of(null);
        }))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  protected saisirTexte(evenement: Event): void {
    this.mettreAJour({ texte: (evenement.target as HTMLInputElement).value }, 300);
  }

  protected choisirClasse(evenement: Event): void {
    this.mettreAJour({ classe: (evenement.target as HTMLSelectElement).value as Classe | '' }, 0);
  }

  protected choisirFiliere(evenement: Event): void {
    this.mettreAJour({ filiere: (evenement.target as HTMLSelectElement).value }, 0);
  }

  protected ajouter(etudiant: EtudiantSuggestion): void {
    this.enCours.set(etudiant.id);
    this.erreur.set(null);
    this.service.ajouter(this.offreId(), etudiant.id).subscribe({
      next: (liste) => {
        this.enCours.set(null);
        this.ajoute.emit(liste);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(null);
        this.erreur.set(erreur.error?.message ?? 'L’étudiant n’a pas pu être ajouté. Réessayez.');
      },
    });
  }

  /** Au moins deux lettres du nom, ou une classe, ou une filière : on ne liste pas toute l’école. */
  private recherchable(criteres: CritereEtudiants): boolean {
    return criteres.texte.trim().length >= 2 || criteres.classe !== '' || criteres.filiere !== '';
  }

  private mettreAJour(changement: Partial<CritereEtudiants>, delai: number): void {
    this.criteres.update((criteres) => ({ ...criteres, ...changement }));
    this.erreur.set(null);
    this.recherches.next({ criteres: this.criteres(), delai });
  }
}
