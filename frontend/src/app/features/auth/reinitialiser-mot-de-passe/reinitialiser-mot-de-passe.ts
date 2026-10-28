import { Component, inject, signal } from '@angular/core';
import { form, FormField, maxLength, minLength, pattern, required } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../../core/services/auth/auth-service';

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  imports: [FormField, InputText, Message, RouterLink],
  templateUrl: './reinitialiser-mot-de-passe.html',
  styleUrl: './reinitialiser-mot-de-passe.scss'
})
export class ReinitialiserMotDePasse {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly email = inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '';

  protected readonly modele = signal({
    code: '',
    nouveauMotDePasse: '',
    confirmation: ''
  });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.code, { message: 'Le code est obligatoire' });
    minLength(champ.code, 6, { message: 'Le code doit contenir 6 chiffres' });
    maxLength(champ.code, 6, { message: 'Le code doit contenir 6 chiffres' });
    pattern(champ.code, /^\d{6}$/, { message: 'Le code doit contenir 6 chiffres' });
    required(champ.nouveauMotDePasse, { message: 'Le nouveau mot de passe est obligatoire' });
    minLength(champ.nouveauMotDePasse, 8, { message: 'Au moins 8 caractères' });
    required(champ.confirmation, { message: 'Confirmez le nouveau mot de passe' });
  });
  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherNouveau = signal(false);
  protected readonly afficherConfirmation = signal(false);

  constructor() {
    if (!this.email) {
      this.router.navigate(['/mot-de-passe-oublie']);
    }
  }

  protected reinitialiser(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }
    const { code, nouveauMotDePasse, confirmation } = this.modele();
    if (nouveauMotDePasse !== confirmation) {
      this.messageErreur.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.authService.reinitialiserMotDePasse(this.email, code, nouveauMotDePasse).subscribe({
      next: () => {
        this.enChargement.set(false);
        this.router.navigate(['/connexion'], {
          state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' }
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de réinitialiser le mot de passe.');
      }
    });
  }
}
