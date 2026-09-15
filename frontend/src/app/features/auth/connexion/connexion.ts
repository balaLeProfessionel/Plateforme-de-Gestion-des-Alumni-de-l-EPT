import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth-service';
import { Router, RouterLink } from '@angular/router';
import { email, form, required, FormField } from '@angular/forms/signals';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-connexion',
  imports: [FormField, InputTextModule, PasswordModule, MessageModule, RouterLink],
  templateUrl: './connexion.html',
  styleUrl: './connexion.scss',
})
export class Connexion {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly afficherMdp = signal(false);

  seConnecter() {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    const { email, password } = this.modele();

    this.authService.login(email, password).subscribe({
      next: (utilisateur) => {
        this.enChargement.set(false);
        this.router.navigate([
          utilisateur.doitChangerMotDePasse ? '/premiere-connexion' : '/accueil'
        ]);
      },
      error: (err) => {
        this.enChargement.set(false);
        const msg = err?.error?.message || 'Une erreur est survenue lors de la connexion';
        this.messageErreur.set(msg);
      }
    })
  }
}
