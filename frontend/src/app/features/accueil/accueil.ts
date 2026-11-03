import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { CarteFil, cleCarte, FilService } from '../../core/services/fil/fil';
import { CartePublication } from '../../shared/publications/carte-publication/carte-publication';
import { CarteEvenementFil } from './cartes-fil/carte-evenement-fil';
import { CarteProgrammeFil } from './cartes-fil/carte-programme-fil';
import { AuthService } from '../../core/services/auth/auth-service';
import { AvatarMembre } from '../../shared/images/avatar-membre';
import { EtatPublicationCreee } from '../publications/creation-publication/creation-publication';

/**
 * Fil d’actualité personnalisé : publications, événements et programmes classés par l’API selon ce qui
 * rapproche le membre de leurs auteurs (promotion, filière, organismes, réactions) et leur fraîcheur.
 */
@Component({ selector: 'app-accueil', imports: [RouterLink, AvatarMembre, CartePublication, CarteEvenementFil, CarteProgrammeFil],
  templateUrl: './accueil.html', styleUrl: './accueil.scss' })
export class Accueil {
  private readonly fil = inject(FilService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cle = cleCarte;
  protected readonly cartes = signal<CarteFil[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal(false);
  protected readonly suiteEnCours = signal(false);
  protected readonly erreurSuite = signal(false);
  protected readonly derniere = signal(true);
  private page = 0;
  private reference: string | null = null;
  protected readonly moi = inject(AuthService).utilisateur;
  protected readonly invitation = computed(() =>
    this.moi()?.prenom ? `Quoi de neuf, ${this.moi()?.prenom} ?` : 'Partager une actualité avec la communauté');
  /** Confirmation laissée par la page de création quand on revient au fil après avoir publié. */
  protected readonly confirmation = signal(this.lireConfirmation());

  constructor() {
    this.charger();
  }

  private lireConfirmation(): string {
    // Seule la navigation en cours compte : un rechargement de la page ne répète pas la confirmation.
    const etat = (inject(Router).getCurrentNavigation()?.extras.state ?? {}) as EtatPublicationCreee;
    return typeof etat.messagePublication === 'string' ? etat.messagePublication : '';
  }

  /** Premier chargement, ou nouvel essai : le classement repart de maintenant. */
  protected charger(): void {
    this.chargement.set(true);
    this.erreur.set(false);
    this.fil.lister(0).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.page = 0;
        this.reference = page.reference;
        this.cartes.set(page.contenu);
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
    this.fil.lister(this.page + 1, this.reference).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
