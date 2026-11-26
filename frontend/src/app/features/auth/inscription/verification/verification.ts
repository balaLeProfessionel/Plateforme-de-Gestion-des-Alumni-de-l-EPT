import { AuthService } from './../../../../core/services/auth/auth-service';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval, take } from 'rxjs';
import { AuthResponse } from '../../../../core/services/models/auth-response.model';
import { CadreInscription } from '../cadre-inscription/cadre-inscription';

const LONGUEUR_CODE = 6;
/** Délai avant de pouvoir redemander un code, en secondes. */
const DELAI_RENVOI = 60;

// Dernière étape de l'inscription : saisie du code reçu par email.
// Un seul vrai champ (lu par les lecteurs d'écran, compatible avec le
// remplissage automatique du code) dessiné en six cases.
@Component({
  selector: 'app-verification',
  imports: [CadreInscription],
  templateUrl: './verification.html',
  styleUrl: './verification.scss',
})
export class Verification {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  // L'email vient du paramètre d'URL passé par le formulaire d'inscription
  protected readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');

  protected readonly code = signal('');
  protected readonly enChargement = signal(false);
  protected readonly enRenvoi = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly messageSucces = signal<string | null>(null);
  protected readonly attenteRenvoi = signal(DELAI_RENVOI);

  protected readonly cases = computed(() =>
    Array.from({ length: LONGUEUR_CODE }, (_, i) => this.code()[i] ?? '')
  );
  /** Case où arrivera le prochain chiffre (mise en évidence). */
  protected readonly caseActive = computed(() => Math.min(this.code().length, LONGUEUR_CODE - 1));
  protected readonly attenteLisible = computed(() => {
    const s = this.attenteRenvoi();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });

  private compteARebours: Subscription | null = null;

  constructor() {
    if (!this.email()) {
      this.router.navigate(['/inscription']);
      return;
    }
    this.demarrerCompteARebours();
  }

  protected saisirCode(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    this.majCode(champ.value);
    // Le champ reflète la valeur nettoyée (lettres et espaces retirés)
    champ.value = this.code();
  }

  majCode(valeur: string) {
    // Garde seulement les chiffres : un code collé avec des espaces passe aussi
    const chiffres = valeur.replace(/\D/g, '').slice(0, LONGUEUR_CODE);
    this.code.set(chiffres);
    this.messageErreur.set(null);
    if (chiffres.length === LONGUEUR_CODE && !this.enChargement()) {
      this.verifier();
    }
  }

  verifier() {
    if (this.code().length !== LONGUEUR_CODE) {
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
    if (this.attenteRenvoi() > 0) return;
    this.enRenvoi.set(true);
    this.messageErreur.set(null);
    this.messageSucces.set(null);

    return this.http
      .post('/api/auth/renvoyer-otp', { email: this.email() })
      .subscribe({
        next: () => {
          this.enRenvoi.set(false);
          this.code.set('');
          this.messageSucces.set('Un nouveau code a été envoyé.');
          this.demarrerCompteARebours();
        },
        error: (err) => {
          this.enRenvoi.set(false);
          this.messageErreur.set(err?.error?.message ?? "Échec de l'envoi.");
        }
      });
  }

  private demarrerCompteARebours(): void {
    this.compteARebours?.unsubscribe();
    this.attenteRenvoi.set(DELAI_RENVOI);
    this.compteARebours = interval(1000)
      .pipe(take(DELAI_RENVOI), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.attenteRenvoi.update((s) => s - 1));
  }
}
