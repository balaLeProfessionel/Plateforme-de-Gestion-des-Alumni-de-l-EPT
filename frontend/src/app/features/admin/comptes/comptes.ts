import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormField, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, map, skip } from 'rxjs';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { CriteresComptes, LIBELLES_ROLE_COMPTE, RoleCompte, StatutCompte } from '../../../core/services/models/admin.model';
import { etatDepuis, EtatListe, parametresDepuis, ROLES_COMPTE } from '../criteres-url';
import { ListeComptes } from '../liste-comptes/liste-comptes';
import { PageAdmin } from '../page-admin/page-admin';

const DELAI_SAISIE_MS = 300;

/** Tous les comptes, filtrés par nom, rôle et statut ; critères et page vivent dans l’URL (GAEPT-6). */
@Component({
  selector: 'app-comptes',
  imports: [FormField, ListeComptes, PageAdmin, RouterLink],
  templateUrl: './comptes.html',
  styleUrl: './comptes.scss',
})
export class Comptes {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly compteur = inject(CompteurInscriptions);

  protected readonly roles = ROLES_COMPTE;
  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  protected readonly filtresStatut: readonly { valeur: StatutCompte | null; libelle: string }[] = [
    { valeur: null, libelle: 'Tous' },
    { valeur: 'ACTIF', libelle: 'Actifs' },
    { valeur: 'EN_ATTENTE', libelle: 'En attente' },
    { valeur: 'SUSPENDU', libelle: 'Suspendus' },
  ];

  protected readonly etat = toSignal(this.route.queryParamMap.pipe(map((params) => etatDepuis(params))), {
    initialValue: etatDepuis(this.route.snapshot.queryParamMap),
  });
  protected readonly criteres = computed(() => this.etat().criteres, {
    equal: (a, b) => a.recherche === b.recherche && a.role === b.role && a.statut === b.statut,
  });
  protected readonly modele = signal({ recherche: this.criteres().recherche });
  protected readonly formulaire = form(this.modele);
  protected readonly nombreParStatut = computed(() => {
    const resume = this.compteur.resume();
    return (statut: StatutCompte | null): number | null => {
      if (!resume) return null;
      if (statut === 'ACTIF') return resume.actifs;
      if (statut === 'EN_ATTENTE') return resume.enAttente;
      if (statut === 'SUSPENDU') return resume.suspendus;
      return resume.actifs + resume.enAttente + resume.suspendus;
    };
  });

  constructor() {
    // Retour / avance du navigateur : le champ reprend la recherche de l’URL.
    toObservable(this.criteres).pipe(takeUntilDestroyed()).subscribe(({ recherche }) => {
      if (this.modele().recherche.trim() !== recherche) this.modele.set({ recherche });
    });
    toObservable(this.modele).pipe(
      skip(1),
      debounceTime(DELAI_SAISIE_MS),
      map(({ recherche }) => recherche.trim()),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe((recherche) => {
      if (recherche !== this.criteres().recherche) this.appliquer({ recherche });
    });
  }

  protected appliquerRecherche(): void {
    const recherche = this.modele().recherche.trim();
    if (recherche !== this.criteres().recherche) this.appliquer({ recherche });
  }

  protected choisirStatut(statut: StatutCompte | null): void {
    this.appliquer({ statut });
  }

  protected choisirRole(valeur: string): void {
    this.appliquer({ role: ROLES_COMPTE.includes(valeur as RoleCompte) ? valeur as RoleCompte : null });
  }

  /** Changer de page ajoute une entrée d’historique : le bouton Retour revient à la page précédente. */
  protected allerPage(page: number): void {
    this.naviguer({ criteres: this.criteres(), page }, false);
  }

  private appliquer(changement: Partial<CriteresComptes>): void {
    this.naviguer({ criteres: { ...this.criteres(), ...changement }, page: 0 }, true);
  }

  private naviguer(etat: EtatListe, remplacer: boolean): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: parametresDepuis(etat), replaceUrl: remplacer });
  }
}
