import { DecimalPipe, DOCUMENT, NgOptimizedImage } from '@angular/common';
import { Component, DestroyRef, ElementRef, Injector, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CHIFFRES_CLES } from '../../vitrine/contenu-vitrine';
import { Router, RouterLink } from '@angular/router';
import { email, form, required, FormField } from '@angular/forms/signals';
import { AuthResponse } from '../../../core/services/models/auth-response.model';
import { ChampFormulaire } from '../../../shared/formulaires/champ-formulaire/champ-formulaire';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { BoutonGoogle } from '../bouton-google/bouton-google';

@Component({
  selector: 'app-connexion',
  imports: [DecimalPipe, NgOptimizedImage, FormField, ChampFormulaire, RouterLink, BoutonGoogle],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion {
  protected readonly chiffres = CHIFFRES_CLES;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  /** Complément du `@media (max-width: 900px)` qui masque le panneau de marque dans connexion.scss. */
  private readonly formatGrandEcran = inject(DOCUMENT).defaultView?.matchMedia?.('(min-width: 901px)');
  protected readonly grandEcran = signal(this.formatGrandEcran?.matches ?? false);

  constructor() {
    const changement = (evenement: MediaQueryListEvent) => this.grandEcran.set(evenement.matches);
    this.formatGrandEcran?.addEventListener('change', changement);
    inject(DestroyRef).onDestroy(() => this.formatGrandEcran?.removeEventListener('change', changement));
  }

  protected readonly modele = signal({
    email: '',
    password: ''
  });

  protected readonly formulaire = form(this.modele,
    (champ) => {
      required(champ.email, {message: "L'email est obligatoire"});
      email(champ.email, {message: "Le format d'email n'est pas valide"});
      required(champ.password, {message: "Le mot de passe est obligatoire"});
    }
  )

  protected readonly enChargement = signal(false);
  /** Message d’une déconnexion forcée (compte suspendu), transmis par l’intercepteur. */
  protected readonly messageErreur = signal<string | null>(history.state?.erreur ?? null);
  protected readonly messageSucces = signal<string | null>(history.state?.message ?? null);
  protected readonly afficherMdp = signal(false);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  // L'utilisateur a déjà essayé de se connecter : toutes les erreurs s'affichent
  private readonly tentee = signal(false);

  /** Erreur affichée après une saisie quittée ou un essai de connexion, pas à l'arrivée. */
  protected erreur(nom: 'email' | 'password'): string | null {
    const champ = this.formulaire[nom]();
    const montrer = (champ.touched() && champ.dirty()) || this.tentee();
    return montrer && champ.invalid() ? (champ.errors()[0]?.message ?? null) : null;
  }

  /** Soumission du formulaire : le bouton comme la touche Entrée dans un champ. */
  seConnecter(evenement?: Event) {
    evenement?.preventDefault();
    this.tentee.set(true);
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    const { email, password } = this.modele();

    this.authService.login(email, password).subscribe({
      next: (utilisateur) => {
        this.enChargement.set(false);
        this.ouvrirEspace(utilisateur);
      },
      error: (err) => {
        this.enChargement.set(false);
        const msg = err?.error?.message || 'Une erreur est survenue lors de la connexion';
        this.messageErreur.set(msg);
      }
    })
  }

  /** Après une connexion par mot de passe ou avec Google. */
  protected ouvrirEspace(utilisateur: AuthResponse) {
    this.messageErreur.set(null);
    this.router.navigate([utilisateur.doitChangerMotDePasse ? '/premiere-connexion' : '/accueil']);
  }

  /** Adresse Google sans compte : on poursuit par l’inscription, pré-remplie avec ce que Google sait. */
  protected inscrireAvecGoogle() {
    void this.router.navigate(['/inscription']);
  }

  protected erreurGoogle(message: string) {
    this.messageSucces.set(null);
    this.messageErreur.set(message);
  }
}
