import { AuthService } from './../../../../core/services/auth/auth-service';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthResponse } from '../../../../core/services/models/auth-response.model';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-verification',
  imports: [Message],
  templateUrl: './verification.html',
  styleUrl: './verification.scss',
})
export class Verification {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  // L'email vient du paramètre d'URL passé par le formulaire d'inscription
  protected readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');

  protected readonly code = signal('');
  protected readonly enChargement = signal(false);
  protected readonly enRenvoi = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly messageSucces = signal<string | null>(null);

  majCode(valeur: string) {
    const chiffres = valeur.replace(/\D/g, '').slice(0, 6); // Supprime tout caractère non numérique et limite à 6 caractères
    this.code.set(chiffres);
  }

  verifier() {
    if (this.code().length !== 6) {
      this.messageErreur.set('Le code doit contenir 6 chiffres');
      return;
    }

    this.enChargement.set(true);
    this.messageErreur.set(null);

    return this.http
      .post<AuthResponse>('/api/auth/verifier-otp', {
        email: this.email(),
        code: this.code()
      })
      .subscribe({
        next: (res) => {
          this.enChargement.set(false);
          // Le token est délivré ici : on le stocke et on entre dans l'app
          this.authService.stocker(res);
          // Chaque profil a son ecran de completion : organisme d'un cote,
          // personnes physiques (alumni, etudiant, enseignant) de l'autre
          if (res.role === 'ORGANISME') {
            this.router.navigate(['/completer-organisme']);
          } else {
            this.router.navigate(['/completer-profil']);
          }
        },
        error: (err) => {
          this.enChargement.set(false);
          this.messageErreur.set(err?.error?.message ?? 'Code incorrect ou expiré.');
        }
      });
  }

  renvoyer() {
    this.enRenvoi.set(true);
    this.messageErreur.set(null);
    this.messageSucces.set(null);

    return this.http
      .post('/api/auth/renvoyer-otp', { email: this.email() })
      .subscribe({
        next: () => {
          this.enRenvoi.set(false);
          this.messageSucces.set('Un nouveau code a été envoyé.');
        },
        error: (err) => {
          this.enRenvoi.set(false);
          this.messageErreur.set(err?.error?.message ?? "Échec de l'envoi.");
        }
      });
  }
}
