import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { CompteAdmin, nomDuCompte, PromotionEtudiante, ResultatDiplomation } from '../../../core/services/models/admin.model';
import { PageAdmin } from '../page-admin/page-admin';
import { erreurAnnee } from '../saisie-annee';

interface Choix { anneeEntree: number | null; filiere: string | null }

/** Faire passer alumni les étudiants d’une promotion d’entrée, en une fois (GAEPT-33). */
@Component({
  selector: 'app-diplomes',
  imports: [FormField, RouterLink, PageAdmin],
  templateUrl: './diplomes.html',
  styleUrls: ['../formulaire-admin.scss', './diplomes.scss'],
})
export class Diplomes {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AdminComptesService);

  protected readonly nomDuCompte = nomDuCompte;
  private readonly version = signal(0);
  protected readonly promotions = signal<PromotionEtudiante[] | null>(null);
  protected readonly choix = toSignal(this.route.queryParamMap.pipe(map(choixDepuis)), {
    initialValue: choixDepuis(this.route.snapshot.queryParamMap),
  });
  protected readonly cleChoisie = computed(() => cle(this.choix()));
  protected readonly etudiants = signal<CompteAdmin[] | null>(null);
  protected readonly selection = signal<ReadonlySet<string>>(new Set());
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal(false);
  protected readonly enCours = signal(false);
  protected readonly resultat = signal<{ annee: number; resultat: ResultatDiplomation } | null>(null);
  protected readonly modele = signal({ anneeSortie: String(new Date().getFullYear()) });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.anneeSortie, { message: 'Indiquez l’année de sortie.' });
    validate(champ.anneeSortie, ({ value }) => erreurAnnee(value(), this.choix().anneeEntree ? String(this.choix().anneeEntree) : undefined));
  });

  constructor() {
    toObservable(this.version).pipe(
      switchMap(() => this.service.promotions().pipe(catchError(() => of([] as PromotionEtudiante[])))),
      takeUntilDestroyed()
    ).subscribe((promotions) => this.promotions.set(promotions));

    toObservable(computed(() => ({ choix: this.choix(), version: this.version() }))).pipe(
      switchMap(({ choix }) => choix.anneeEntree === null && choix.filiere === null ? of({ etudiants: null, erreur: null })
        : this.service.rechercher({ recherche: '', role: 'ETUDIANT', statut: null, ...choix }, 0, 100).pipe(
          map((page) => ({ etudiants: page.contenu.filter((compte) => compte.statutCompte !== 'SUSPENDU'), erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({ etudiants: null, erreur: erreur.error?.message ?? 'Impossible de charger les étudiants.' })))),
      takeUntilDestroyed()
    ).subscribe(({ etudiants, erreur }) => {
      this.etudiants.set(etudiants);
      this.erreur.set(erreur);
      this.selection.set(new Set((etudiants ?? []).map((compte) => compte.id)));
      this.confirmation.set(false);
    });
  }

  protected libellePromotion(promotion: PromotionEtudiante): string {
    return `${promotion.anneeEntree ?? 'Année d’entrée inconnue'} · ${promotion.filiere ?? 'Filière non renseignée'} (${promotion.nombre} ${promotion.nombre > 1 ? 'étudiants' : 'étudiant'})`;
  }

  protected cleDe(promotion: PromotionEtudiante): string {
    return cle(promotion);
  }

  protected choisirPromotion(valeur: string): void {
    const promotion = this.promotions()?.find((p) => cle(p) === valeur);
    const queryParams: Record<string, string> = {};
    if (promotion?.anneeEntree) queryParams['entree'] = String(promotion.anneeEntree);
    if (promotion?.filiere) queryParams['filiere'] = promotion.filiere;
    if (promotion && !promotion.anneeEntree && !promotion.filiere) queryParams['entree'] = 'aucune';
    this.resultat.set(null);
    void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
  }

  protected basculer(id: string): void {
    this.selection.update((selection) => {
      const suivante = new Set(selection);
      if (suivante.has(id)) suivante.delete(id); else suivante.add(id);
      return suivante;
    });
  }

  protected toutBasculer(): void {
    const etudiants = this.etudiants() ?? [];
    this.selection.set(this.selection().size === etudiants.length ? new Set() : new Set(etudiants.map((compte) => compte.id)));
  }

  protected demanderConfirmation(): void {
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid() || this.selection().size === 0) return;
    this.confirmation.set(true);
  }

  protected marquer(): void {
    if (this.enCours()) return;
    const annee = Number(this.modele().anneeSortie);
    this.enCours.set(true);
    this.service.marquerDiplomes([...this.selection()], annee).subscribe({
      next: (resultat) => {
        this.enCours.set(false);
        this.resultat.set({ annee, resultat });
        this.version.update((version) => version + 1);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’enregistrement a échoué. Réessayez.');
      },
    });
  }
}

function cle(choix: Choix): string {
  return `${choix.anneeEntree ?? ''}|${choix.filiere ?? ''}`;
}

function choixDepuis(params: ParamMap): Choix {
  const entree = Number(params.get('entree'));
  return {
    anneeEntree: Number.isInteger(entree) && entree >= 1975 ? entree : null,
    filiere: params.get('filiere') || null,
  };
}
