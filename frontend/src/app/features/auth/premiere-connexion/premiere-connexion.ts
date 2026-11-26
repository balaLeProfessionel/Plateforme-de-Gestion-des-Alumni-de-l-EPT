import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, Injector, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

/** Nom posé par PremierAdminInitializer (backend) : ce n’est pas celui d’une personne, on ne le préremplit pas. */
const NOM_PREMIER_ADMIN = { prenom: 'Administration', nom: 'EPT' };

/**
 * Premier mot de passe d’un compte créé par l’administration ou par la configuration du serveur.
 * Un compte d’administration indique aussi son nom : il n’a pas de profil de membre, et le journal l’affiche comme auteur.
 */
@Component({
  selector: 'app-premiere-connexion',
  imports: [FormField],
  templateUrl: './premiere-connexion.html',
  styleUrl: './premiere-connexion.scss'
})
export class PremiereConnexion {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private readonly utilisateur = this.authService.utilisateur();
  protected readonly estAdmin = this.utilisateur?.role === 'ADMIN';
  private readonly nomProvisoire = this.utilisateur?.prenom === NOM_PREMIER_ADMIN.prenom
    && this.utilisateur?.nom === NOM_PREMIER_ADMIN.nom;

  protected readonly modele = signal({
    prenom: this.estAdmin && !this.nomProvisoire ? this.utilisateur?.prenom ?? '' : '',
    nom: this.estAdmin && !this.nomProvisoire ? this.utilisateur?.nom ?? '' : '',
    nouveauMotDePasse: '',
    confirmation: ''
  });

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.prenom, { message: 'Indiquez votre prénom.', when: () => this.estAdmin });
    maxLength(champ.prenom, 100, { message: '100 caractères au maximum.' });
    required(champ.nom, { message: 'Indiquez votre nom.', when: () => this.estAdmin });
    maxLength(champ.nom, 100, { message: '100 caractères au maximum.' });
    required(champ.nouveauMotDePasse, { message: 'Choisissez un nouveau mot de passe.' });
    minLength(champ.nouveauMotDePasse, 8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    required(champ.confirmation, { message: 'Saisissez à nouveau le mot de passe.' });
    validate(champ.confirmation, ({ value, valueOf }) => value() && value() !== valueOf(champ.nouveauMotDePasse)
      ? { kind: 'differents', message: 'Les deux mots de passe ne correspondent pas.' }
      : undefined);
  });

  /** La règle n’apparaît que pendant la saisie d’un mot de passe trop court, et pas en plus de l’erreur. */
  protected readonly regleVisible = computed(() => {
    const longueur = this.modele().nouveauMotDePasse.length;
    const champ = this.formulaire.nouveauMotDePasse();
    return longueur > 0 && longueur < 8 && !(champ.touched() && champ.invalid());
  });

  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherNouveau = signal(false);
  protected readonly afficherConfirmation = signal(false);

  protected enregistrer(evenement: Event): void {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }

    const { prenom, nom, nouveauMotDePasse } = this.modele();
    this.enChargement.set(true);
    this.messageErreur.set(null);
    const identite = this.estAdmin ? { prenom: prenom.trim(), nom: nom.trim() } : undefined;
    this.authService.changerMotDePasseInitial(nouveauMotDePasse, identite).subscribe({
      next: () => {
        this.enChargement.set(false);
        this.router.navigate([this.estAdmin ? '/admin' : '/completer-profil']);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enChargement.set(false);
        this.messageErreur.set(erreur.error?.message ?? 'Impossible de définir le nouveau mot de passe. Réessayez.');
      }
    });
  }

  protected seDeconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
