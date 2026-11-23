import { Component, computed, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { AnnuaireService } from '../../../core/services/annuaire/annuaire';
import { AuthService } from '../../../core/services/auth/auth-service';
import { AnnuaireMembre } from '../../../core/services/models/annuaire.model';
import { MembreChoisi } from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { SqueletteLignes } from '../squelettes';
import { PRESENTATION_ROLES_MEMBRE } from '../../../shared/roles/etiquette-role';

const DELAI_SAISIE_MS = 300;
const LONGUEUR_MIN_RECHERCHE = 2;
const RESULTATS_MAX = 8;

/** Recherche de membres dans l’annuaire et liste des membres choisis, pour une conversation ou un groupe. */
@Component({
  selector: 'app-selection-membres',
  imports: [FormField, AvatarMembre, SqueletteLignes],
  templateUrl: './selection-membres.html',
  styleUrl: './selection-membres.scss',
})
export class SelectionMembres {
  private readonly annuaire = inject(AnnuaireService);
  private readonly authService = inject(AuthService);
  readonly choisis = model<MembreChoisi[]>([]);
  /** Membres à ne pas proposer (déjà dans le groupe). Je ne me propose jamais moi-même. */
  readonly exclus = input<readonly string[]>([]);
  /** Rôles proposés (une communauté : alumni et étudiants) ; null : tous. */
  readonly roles = input<readonly string[] | null>(null);
  /** Préfixe des identifiants HTML : deux sélecteurs peuvent coexister dans la page. */
  readonly identifiant = input.required<string>();
  readonly libelle = input('Rechercher un membre');
  /** Champ à focaliser à l’ouverture de la fenêtre (`<dialog>` respecte `autofocus`). */
  readonly focusInitial = input(false);

  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele);
  protected readonly resultats = signal<AnnuaireMembre[]>([]);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly rechercheCourte = computed(() => this.modele().recherche.trim().length < LONGUEUR_MIN_RECHERCHE);

  protected readonly propositions = computed(() => {
    const ecartes = new Set([...this.exclus(), this.authService.utilisateur()?.id]);
    const choisis = new Set(this.choisis().map((membre) => membre.id));
    const roles = this.roles();
    return this.resultats()
      .filter((membre) => !ecartes.has(membre.id) && (!roles || roles.includes(membre.role)))
      .map((membre) => ({ membre, choisi: choisis.has(membre.id), role: this.libelleRole(membre.role) }));
  });

  constructor() {
    toObservable(this.modele).pipe(
      map(({ recherche }) => recherche.trim()),
      debounceTime(DELAI_SAISIE_MS),
      distinctUntilChanged(),
      tap(() => this.erreur.set(null)),
      switchMap((recherche) => {
        if (recherche.length < LONGUEUR_MIN_RECHERCHE) return of([]);
        this.chargement.set(true);
        return this.annuaire.rechercher({
          recherche, role: 'TOUS', filiere: '', promotion: '', ville: '', tri: 'ALPHABETIQUE', page: 0, taille: RESULTATS_MAX,
        }).pipe(
          map((page) => page.contenu),
          catchError(() => {
            this.erreur.set('La recherche a échoué. Réessayez.');
            return of([]);
          }));
      }),
      takeUntilDestroyed(),
    ).subscribe((membres) => {
      this.resultats.set(membres);
      this.chargement.set(false);
    });
  }

  protected basculer(membre: AnnuaireMembre): void {
    this.choisis.update((liste) => liste.some((choisi) => choisi.id === membre.id)
      ? liste.filter((choisi) => choisi.id !== membre.id)
      : [...liste, { id: membre.id, prenom: membre.prenom, nom: membre.nom, role: membre.role, urlPhoto: membre.urlPhoto }]);
  }

  protected retirer(id: string): void {
    this.choisis.update((liste) => liste.filter((membre) => membre.id !== id));
  }

  /** Vide la recherche (à la réouverture d’une fenêtre). */
  vider(): void {
    this.modele.set({ recherche: '' });
    this.resultats.set([]);
  }

  protected nomComplet(membre: { prenom: string | null; nom: string }): string {
    return [membre.prenom, membre.nom].filter(Boolean).join(' ');
  }

  private libelleRole(role: string): string {
    return PRESENTATION_ROLES_MEMBRE[role]?.libelle ?? (role === 'ORGANISME' ? 'Organisme' : 'Membre');
  }
}
