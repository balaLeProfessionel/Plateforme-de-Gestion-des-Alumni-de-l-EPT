import { Component, inject, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { AuthService } from '../../../core/services/auth/auth-service';

@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [FormField, InputText, Message, RouterLink],
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: './mot-de-passe-oublie.scss'
})
export class MotDePasseOublie {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modele = signal({ email: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.email, { message: "L'email est obligatoire" });
    email(champ.email, { message: "Le format d'email n'est pas valide" });
  });
  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  protected envoyerCode(): void {
    if (this.formulaire().invalid()) {
      this.formulaire().markAsTouched();
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);
    const emailSaisi = this.modele().email.trim().toLowerCase();
    this.authService.demanderReinitialisation(emailSaisi).subscribe({
      next: () => {
        this.enChargement.set(false);
        this.router.navigate(['/reinitialiser-mot-de-passe'], {
          queryParams: { email: emailSaisi }
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.enChargement.set(false);
        this.messageErreur.set(err?.error?.message ?? "Impossible d'envoyer le code.");
      }
    });
  }
}
