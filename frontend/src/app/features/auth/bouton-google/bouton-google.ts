import { Component, effect, ElementRef, inject, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../../core/services/auth/auth-service';
import { AuthResponse } from '../../../core/services/models/auth-response.model';
import { IdentiteInscriptionGoogle, InscriptionGoogle } from '../../../core/services/auth/inscription-google';
import { ChargeurGoogle, IdentiteGoogle } from './chargeur-google';

/** Réponse 404 « COMPTE_INCONNU » : ce que Google sait de la personne, pour pré-remplir l’inscription. */
function identiteInconnue(err: HttpErrorResponse, credential: string): IdentiteInscriptionGoogle | null {
  const corps: unknown = err?.error;
  if (err?.status !== 404 || typeof corps !== 'object' || corps === null) return null;
  const { code, email, prenom, nom } = corps as Record<string, unknown>;
  if (code !== 'COMPTE_INCONNU' || typeof email !== 'string' || !email) return null;
  return {
    credential,
    email,
    prenom: typeof prenom === 'string' ? prenom : '',
    nom: typeof nom === 'string' ? nom : '',
  };
}

/**
 * Bouton officiel « Continuer avec Google ». Absent tant que le serveur n'a pas d'identifiant
 * client Google ou que la bibliothèque Google n'a pas pu être chargée (bloqueur, hors ligne).
 */
@Component({
  selector: 'app-bouton-google',
  template: `
    @if (disponible()) {
      <p class="separateur" aria-hidden="true"><span>ou</span></p>
      <div #emplacement class="emplacement" [attr.aria-busy]="enCours()"></div>
    }
  `,
  styles: `
    :host { display: block; }
    .separateur {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1.25rem 0 1rem;
      color: var(--ept-text-secondary);
      font-size: 0.875rem;
    }
    .separateur::before, .separateur::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--ept-border);
    }
    .emplacement {
      display: flex;
      justify-content: center;
      min-height: 44px;
    }
  `,
})
export class BoutonGoogle {
  private readonly authService = inject(AuthService);
  private readonly chargeur = inject(ChargeurGoogle);

  /** Session ouverte : le parent choisit la page suivante. */
  readonly connecte = output<AuthResponse>();
  /** Message à afficher (compte suspendu, échec de Google…). */
  readonly erreur = output<string>();
  /** Aucun compte n’utilise cette adresse : l’identité est retenue, l’inscription peut continuer. */
  readonly inscriptionRequise = output();
  private readonly inscriptionGoogle = inject(InscriptionGoogle);

  private readonly emplacement = viewChild<ElementRef<HTMLElement>>('emplacement');
  private readonly clientId = signal<string | null>(null);
  private readonly bibliotheque = signal<IdentiteGoogle | null>(null);
  protected readonly disponible = signal(false);
  protected readonly enCours = signal(false);

  constructor() {
    this.authService.configurationGoogle().pipe(takeUntilDestroyed()).subscribe({
      next: ({ clientId }) => {
        if (!clientId) return;
        this.clientId.set(clientId);
        this.chargeur.charger().then(
          (identite) => {
            this.bibliotheque.set(identite);
            this.disponible.set(true);
          },
          () => this.disponible.set(false),
        );
      },
      // Sans configuration lisible, on garde simplement la connexion par mot de passe.
      error: () => this.disponible.set(false),
    });

    effect(() => {
      const emplacement = this.emplacement()?.nativeElement;
      const identite = this.bibliotheque();
      const clientId = this.clientId();
      if (!emplacement || !identite || !clientId) return;
      identite.initialize({
        client_id: clientId,
        callback: ({ credential }) => this.connecter(credential),
        ux_mode: 'popup',
        context: 'signin',
      });
      identite.renderButton(emplacement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'center',
        locale: 'fr',
        width: Math.min(400, Math.max(200, emplacement.clientWidth || 320)),
      });
    });
  }

  private connecter(credential: string) {
    this.enCours.set(true);
    this.authService.connexionGoogle(credential).subscribe({
      next: (utilisateur) => {
        this.enCours.set(false);
        this.connecte.emit(utilisateur);
      },
      error: (err: HttpErrorResponse) => {
        this.enCours.set(false);
        const identite = identiteInconnue(err, credential);
        if (identite) {
          this.inscriptionGoogle.retenir(identite);
          this.inscriptionRequise.emit();
          return;
        }
        const message: unknown = err?.error?.message;
        this.erreur.emit(typeof message === 'string' && message ? message : 'La connexion avec Google a échoué. Réessayez.');
      },
    });
  }
}
