import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, ElementRef, inject, InjectionToken, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent, interval, merge, MonoTypeOperatorFunction, retry, throwError, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CarteFil, cleCarte, FilService } from '../../core/services/fil/fil';
import { Publication, PublicationService } from '../../core/services/publications/publication';
import { CartePublication } from '../../shared/publications/carte-publication/carte-publication';
import { CarteEvenementFil } from './cartes-fil/carte-evenement-fil';
import { CarteProgrammeFil } from './cartes-fil/carte-programme-fil';
import { SqueletteFil } from './cartes-fil/squelette-fil';
import { ColonneCollante } from './colonne-collante';
import { ColonneFil } from './colonne-fil';
import { ComposeurFil } from './composeur-fil';
import { AuthService } from '../../core/services/auth/auth-service';
import { EtatPublicationCreee } from '../publications/creation-publication/creation-publication';

/** Nombre de cartes après lesquelles une même raison de suggestion peut réapparaître. */
const ESPACEMENT_RAISON = 3;
/** Distance sous l’écran à laquelle on commence à charger la suite du fil. */
const MARGE_CHARGEMENT_PX = 900;

/** Délais du fil, remplaçables dans les tests. */
export interface DelaisFil {
  /** Attente avant un nouvel essai quand l’API ne répond pas (redémarrage, réseau). */
  nouvelEssai: number;
  /** Fréquence à laquelle on regarde s’il y a de nouvelles publications. */
  nouveautes: number;
}
export const DELAIS_FIL = new InjectionToken<DelaisFil>('DELAIS_FIL', {
  factory: () => ({ nouvelEssai: 2000, nouveautes: 60_000 }),
});

/** Attentes successives (en multiples du délai de base) : environ 20 s au total, le temps d’un redémarrage de l’API. */
const PALIERS_ESSAI = [1, 1.5, 2.5, 3];

/** Nouveaux essais pour une erreur passagère (réseau, 5xx) ; une erreur 4xx s’affiche tout de suite. */
function reessayer<T>(delai: number): MonoTypeOperatorFunction<T> {
  return retry({ count: PALIERS_ESSAI.length, delay: (erreur: unknown, essai: number) =>
    erreur instanceof HttpErrorResponse && erreur.status > 0 && erreur.status < 500
      ? throwError(() => erreur) : timer(delai * PALIERS_ESSAI[essai - 1]) });
}

/**
 * Fil d’actualité personnalisé : publications, événements et programmes classés par l’API selon ce qui
 * rapproche le membre de leurs auteurs (promotion, filière, organismes, réactions) et leur fraîcheur.
 */
@Component({ selector: 'app-accueil', imports: [ComposeurFil, ColonneFil, ColonneCollante, CartePublication, CarteEvenementFil, CarteProgrammeFil, SqueletteFil],
  templateUrl: './accueil.html', styleUrl: './accueil.scss' })
export class Accueil {
  private readonly fil = inject(FilService);
  private readonly publications = inject(PublicationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly delais = inject(DELAIS_FIL);
  private readonly document = inject(DOCUMENT);
  protected readonly cle = cleCarte;
  /** Publications parues depuis le chargement du fil, annoncées sans recharger la page sous les yeux. */
  private readonly nouvelles = signal<Publication[]>([]);
  protected readonly nouveautes = computed(() => this.nouvelles().length);
  protected readonly cartes = signal<CarteFil[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal(false);
  protected readonly suiteEnCours = signal(false);
  protected readonly erreurSuite = signal(false);
  protected readonly derniere = signal(true);
  /**
   * Raisons à montrer : une même raison n’est pas répétée sur les trois cartes qui suivent celle où elle
   * vient d’apparaître, pour que la mention reste informative quand un signal domine tout le fil.
   */
  protected readonly raisons = computed(() => {
    const affichees = new Map<string, string>();
    const derniereApparition = new Map<string, number>();
    this.cartes().forEach((carte, index) => {
      if (!carte.raison) return;
      const precedente = derniereApparition.get(carte.raison);
      if (precedente !== undefined && index - precedente <= ESPACEMENT_RAISON) return;
      affichees.set(cleCarte(carte), carte.raison);
      derniereApparition.set(carte.raison, index);
    });
    return affichees;
  });
  private readonly repereSuite = viewChild<ElementRef<HTMLElement>>('repereSuite');
  private page = 0;
  private reference: string | null = null;
  protected readonly moi = inject(AuthService).utilisateur;
  /** La colonne « Pour vous » n’est affichée (et chargée) que sur grand écran. */
  protected readonly grandEcran = this.suivreLargeur('(min-width: 1200px)');
  /** Confirmation laissée par la page de création quand on revient au fil après avoir publié. */
  protected readonly confirmation = signal(this.lireConfirmation());

  constructor() {
    this.charger();
    // Défilement continu : la suite se charge quand le repère sous les cartes approche de l’écran.
    // L’observateur est recréé à chaque nouvelle page, pour enchaîner si le repère est encore visible.
    effect((nettoyer) => {
      const repere = this.repereSuite()?.nativeElement;
      this.cartes();
      if (!repere || typeof IntersectionObserver === 'undefined') return;
      const observateur = new IntersectionObserver((entrees) => {
        if (entrees.some((e) => e.isIntersecting) && !this.erreurSuite()) this.chargerSuite();
      }, { rootMargin: `0px 0px ${MARGE_CHARGEMENT_PX}px 0px` });
      observateur.observe(repere);
      nettoyer(() => observateur.disconnect());
    });
    // Nouveautés : vérifiées régulièrement et quand on revient sur l’onglet.
    const retourOnglet = fromEvent(this.document, 'visibilitychange').pipe(filter(() => this.document.visibilityState === 'visible'));
    merge(interval(this.delais.nouveautes), retourOnglet).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.verifierNouveautes());
  }

  /** Remonte en haut du fil et le recharge avec les nouvelles publications. */
  protected afficherNouveautes(): void {
    const enTete = this.nouvelles();
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
    this.charger(enTete);
  }

  private verifierNouveautes(): void {
    const reference = this.reference;
    if (!reference || this.chargement() || this.erreur()) return;
    // Le fil est classé par pertinence : les nouveautés se repèrent dans la liste chronologique des publications.
    this.publications.lister(0, 10).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        const vues = new Set(this.cartes().map(cleCarte));
        const moi = this.moi()?.id;
        const nouvelles = page.contenu.filter((p) => p.auteurId !== moi && !vues.has(`p-${p.id}`)
          && new Date(p.publieLe).getTime() > new Date(reference).getTime());
        this.nouvelles.set(nouvelles);
      },
      error: () => undefined,
    });
  }

  private suivreLargeur(requete: string) {
    const media = this.document.defaultView?.matchMedia?.(requete);
    const correspond = signal(media?.matches ?? false);
    if (media) {
      fromEvent<MediaQueryListEvent>(media, 'change').pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((evenement) => correspond.set(evenement.matches));
    }
    return correspond.asReadonly();
  }

  private lireConfirmation(): string {
    // Seule la navigation en cours compte : un rechargement de la page ne répète pas la confirmation.
    const etat = (inject(Router).getCurrentNavigation()?.extras.state ?? {}) as EtatPublicationCreee;
    return typeof etat.messagePublication === 'string' ? etat.messagePublication : '';
  }

  /**
   * Premier chargement, ou nouvel essai : le classement repart de maintenant. Les nouveautés demandées
   * par la pastille passent en tête, même si le classement les place plus bas.
   */
  protected charger(enTete: Publication[] = []): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.nouvelles.set([]);
    this.fil.lister(0).pipe(reessayer(this.delais.nouvelEssai), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.page = 0;
        this.reference = page.reference;
        const premieres: CarteFil[] = enTete.map((publication) => ({ type: 'PUBLICATION', publication, raison: null }));
        const placees = new Set(premieres.map(cleCarte));
        this.cartes.set([...premieres, ...page.contenu.filter((c) => !placees.has(cleCarte(c)))]);
        this.derniere.set(page.derniere);
        this.chargement.set(false);
      },
      error: () => {
        this.cartes.set([]);
        this.erreur.set(true);
        this.chargement.set(false);
      },
    });
  }

  /** Page suivante, au même instant de référence ; une carte déjà montrée n’est pas répétée. */
  protected chargerSuite(): void {
    if (this.suiteEnCours() || this.derniere()) return;
    this.suiteEnCours.set(true);
    this.erreurSuite.set(false);
    this.fil.lister(this.page + 1, this.reference).pipe(reessayer(this.delais.nouvelEssai), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.page = page.page;
        const vues = new Set(this.cartes().map(cleCarte));
        this.cartes.update((cartes) => [...cartes, ...page.contenu.filter((c) => !vues.has(cleCarte(c)))]);
        this.derniere.set(page.derniere);
        this.suiteEnCours.set(false);
      },
      error: () => {
        this.erreurSuite.set(true);
        this.suiteEnCours.set(false);
      },
    });
  }
}
