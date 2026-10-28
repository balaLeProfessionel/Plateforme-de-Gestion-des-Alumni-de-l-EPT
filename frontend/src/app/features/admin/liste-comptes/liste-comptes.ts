import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, input, model, signal, viewChild, viewChildren,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { CompteAdmin, CriteresComptes, nomDuCompte } from '../../../core/services/models/admin.model';
import { Page } from '../../../core/services/models/mentorat.model';
import { LigneCompte } from '../ligne-compte/ligne-compte';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';

/** Temps laissé pour annuler une validation avant de l’envoyer au serveur. */
export const DELAI_ANNULATION_MS = 6000;

interface Annonce {
  texte: string;
  erreur?: boolean;
}

/** Où remettre le focus quand la liste est rechargée après une décision. */
type CibleFocus = { type: 'compte'; id: string; index: number } | { type: 'resume' } | null;

/**
 * Résultats paginés d’une recherche de comptes, avec les quatre états et les actions de chaque ligne.
 * Une validation est différée de quelques secondes pour pouvoir l’annuler ; après chaque décision
 * le focus passe à la ligne suivante, pour enchaîner les vérifications au clavier.
 */
@Component({
  selector: 'app-liste-comptes',
  imports: [LigneCompte, PaginationAdmin],
  templateUrl: './liste-comptes.html',
  styleUrls: ['../etats-admin.scss', './liste-comptes.scss'],
})
export class ListeComptes {
  private readonly service = inject(AdminComptesService);
  private readonly compteur = inject(CompteurInscriptions);
  private readonly injector = inject(Injector);

  readonly criteres = input.required<CriteresComptes>();
  /** Numéro de page (à partir de 0) ; la page parente le garde dans l’URL. */
  readonly page = model(0);
  readonly titreVide = input('Aucun compte');
  readonly texteVide = input('Aucun compte ne correspond à ces critères.');

  private readonly version = signal(0);
  protected readonly resultat = signal<Page<CompteAdmin> | null>(null);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);
  /** Confirmation (ou échec) de la dernière décision, annoncée aux lecteurs d’écran. */
  protected readonly annonce = signal<Annonce | null>(null);
  /** Validation en attente d’envoi, encore annulable. */
  protected readonly enSursis = signal<CompteAdmin | null>(null);
  /** Comptes validés : masqués jusqu’au rechargement qui les retire de la liste. */
  private readonly masques = signal<ReadonlySet<string>>(new Set());
  protected readonly comptes = computed(() =>
    (this.resultat()?.contenu ?? []).filter((compte) => !this.masques().has(compte.id)));
  protected readonly total = computed(() => Math.max(0, (this.resultat()?.totalElements ?? 0) - this.masquesAffiches()));
  private readonly masquesAffiches = computed(() =>
    (this.resultat()?.contenu ?? []).filter((compte) => this.masques().has(compte.id)).length);

  private readonly lignes = viewChildren(LigneCompte);
  private readonly resume = viewChild<ElementRef<HTMLElement>>('resume');
  private readonly etat = viewChild<ElementRef<HTMLElement>>('etat');
  private minuteur: ReturnType<typeof setTimeout> | null = null;
  private cibleFocus: CibleFocus = null;

  constructor() {
    toObservable(computed(() => ({ criteres: this.criteres(), numero: this.page(), version: this.version() }))).pipe(
      switchMap(({ criteres, numero }) => {
        this.enChargement.set(true);
        return this.service.rechercher(criteres, numero).pipe(
          map((page) => ({ page, erreur: null })),
          catchError((erreur: HttpErrorResponse) => of({
            page: null,
            erreur: erreur.error?.message ?? 'Impossible de charger les comptes.',
          })));
      }),
      takeUntilDestroyed()
    ).subscribe(({ page, erreur }) => {
      this.resultat.set(page);
      this.messageErreur.set(erreur);
      this.enChargement.set(false);
      // Les comptes validés ont quitté la liste : plus rien à masquer, sauf celui encore en sursis.
      const sursis = this.enSursis();
      this.masques.set(new Set(sursis ? [sursis.id] : []));
      this.restaurerFocus();
    });
    // Quitter la page n’annule pas une validation : elle part tout de suite.
    inject(DestroyRef).onDestroy(() => this.envoyerValidation());
    // Fermer ou recharger l’onglet non plus : la validation part avant que la page disparaisse.
    const vue = inject(DOCUMENT).defaultView;
    const auDepart = () => this.validerAuDepart();
    vue?.addEventListener('pagehide', auDepart);
    inject(DestroyRef).onDestroy(() => vue?.removeEventListener('pagehide', auDepart));
  }

  protected changerPage(numero: number): void {
    this.envoyerValidation();
    this.cibleFocus = { type: 'resume' };
    this.page.set(numero);
  }

  protected demanderValidation(compte: CompteAdmin, index: number): void {
    this.envoyerValidation();
    this.enSursis.set(compte);
    this.masques.update((masques) => new Set([...masques, compte.id]));
    this.annonce.set({ texte: `Inscription de ${nomDe(compte)} validée.` });
    this.minuteur = setTimeout(() => this.envoyerValidation(), DELAI_ANNULATION_MS);
    this.focaliserLigne(index);
  }

  protected annulerValidation(): void {
    const compte = this.enSursis();
    if (!compte) return;
    this.arreterMinuteur();
    this.enSursis.set(null);
    this.masques.update((masques) => new Set([...masques].filter((id) => id !== compte.id)));
    this.annonce.set({ texte: `Validation de ${nomDe(compte)} annulée.` });
    afterNextRender(() => this.lignes().find((ligne) => ligne.compte().id === compte.id)?.focaliser(), { injector: this.injector });
  }

  protected surModification(compte: CompteAdmin, index: number, message: string): void {
    this.annonce.set({ texte: message });
    this.cibleFocus = { type: 'compte', id: compte.id, index };
    this.recharger();
  }

  private envoyerValidation(): void {
    this.arreterMinuteur();
    const compte = this.enSursis();
    if (!compte) return;
    this.enSursis.set(null);
    this.service.valider(compte.id).subscribe({
      next: () => this.recharger(),
      error: (erreur: HttpErrorResponse) => {
        this.masques.update((masques) => new Set([...masques].filter((id) => id !== compte.id)));
        this.annonce.set({
          texte: erreur.error?.message ?? `La validation de ${nomDe(compte)} n’a pas abouti. Réessayez.`,
          erreur: true,
        });
      },
    });
  }

  private validerAuDepart(): void {
    this.arreterMinuteur();
    const compte = this.enSursis();
    if (!compte) return;
    this.enSursis.set(null);
    this.service.validerAuDepart(compte.id);
  }

  private recharger(): void {
    this.compteur.actualiser();
    this.version.update((version) => version + 1);
  }

  private arreterMinuteur(): void {
    if (this.minuteur) clearTimeout(this.minuteur);
    this.minuteur = null;
  }

  /** Après le rendu, donne le focus à la ligne de cette position (ou à la dernière, ou à l’état vide). */
  private focaliserLigne(index: number): void {
    afterNextRender(() => {
      const lignes = this.lignes();
      const ligne = lignes[Math.min(index, lignes.length - 1)];
      if (ligne) ligne.focaliser();
      else this.etat()?.nativeElement.focus();
    }, { injector: this.injector });
  }

  private restaurerFocus(): void {
    const cible = this.cibleFocus;
    this.cibleFocus = null;
    if (!cible) return;
    if (cible.type === 'resume') {
      afterNextRender(() => {
        const resume = this.resume()?.nativeElement;
        resume?.scrollIntoView({ block: 'start' });
        resume?.focus({ preventScroll: true });
      }, { injector: this.injector });
      return;
    }
    const position = this.comptes().findIndex((compte) => compte.id === cible.id);
    this.focaliserLigne(position >= 0 ? position : cible.index);
  }
}

function nomDe(compte: CompteAdmin): string {
  return nomDuCompte(compte);
}
