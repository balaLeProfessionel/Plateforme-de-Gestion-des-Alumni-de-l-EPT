import { Component, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../../core/services/auth/auth-service';

@Component({
  selector: 'app-premiere-connexion',
  imports: [FormField, InputText, Message],
  templateUrl: './premiere-connexion.html',
  styleUrl: './premiere-connexion.scss'
})
export class PremiereConnexion {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modele = signal({
    nouveauMotDePasse: '',
    confirmation: ''
  });

  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nouveauMotDePasse, { message: 'Le nouveau mot de passe est obligatoire' });
    minLength(champ.nouveauMotDePasse, 8, { message: 'Au moins 8 caractères' });
    required(champ.confirmation, { message: 'Confirmez le nouveau mot de passe' });
  });

  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherNouveau = signal(false);
  protected readonly afficherConfirmation = signal(false);

  protected enregistrer(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }

    const { nouveauMotDePasse, confirmation } = this.modele();
    if (nouveauMotDePasse !== confirmation) {
      this.messageErreur.set('Les mots de passe ne correspondent pas.');
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.authService.changerMotDePasseInitial(nouveauMotDePasse).subscribe({
      next: () => {
        this.enChargement.set(false);
        this.router.navigate(['/completer-profil/infos']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.enChargement.set(false);
        this.messageErreur.set(
          err?.error?.message ?? "Impossible de définir le nouveau mot de passe."
        );
      }
    });
  }
}
