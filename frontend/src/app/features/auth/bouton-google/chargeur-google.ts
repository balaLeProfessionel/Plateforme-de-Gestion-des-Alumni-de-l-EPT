import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';

/** Réponse du bouton Google : le jeton d'identité signé par Google, vérifié ensuite par le serveur. */
export interface ReponseGoogle {
  credential: string;
}

/** Partie de Google Identity Services utilisée ici (`google.accounts.id`). */
export interface IdentiteGoogle {
  initialize(options: {
    client_id: string;
    callback: (reponse: ReponseGoogle) => void;
    ux_mode?: 'popup' | 'redirect';
    context?: 'signin' | 'signup' | 'use';
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    emplacement: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill';
      logo_alignment?: 'left' | 'center';
      locale?: string;
      width?: number;
    },
  ): void;
}

const SCRIPT_GOOGLE = 'https://accounts.google.com/gsi/client';

/** Charge une seule fois la bibliothèque Google Identity Services, uniquement quand on en a besoin. */
@Service()
export class ChargeurGoogle {
  private readonly document = inject(DOCUMENT);
  private chargement: Promise<IdentiteGoogle> | null = null;

  charger(): Promise<IdentiteGoogle> {
    this.chargement ??= new Promise<IdentiteGoogle>((resoudre, rejeter) => {
      const dejaLa = this.lire();
      if (dejaLa) {
        resoudre(dejaLa);
        return;
      }
      const script = this.document.createElement('script');
      script.src = SCRIPT_GOOGLE;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const identite = this.lire();
        if (identite) {
          resoudre(identite);
        } else {
          rejeter(new Error('Google Identity Services indisponible'));
        }
      };
      script.onerror = () => {
        // Un bloqueur ou une coupure réseau : on pourra réessayer à la prochaine visite de la page.
        this.chargement = null;
        rejeter(new Error('Google Identity Services indisponible'));
      };
      this.document.head.appendChild(script);
    });
    return this.chargement;
  }

  private lire(): IdentiteGoogle | null {
    const fenetre = this.document.defaultView as (Window & { google?: { accounts?: { id?: IdentiteGoogle } } }) | null;
    return fenetre?.google?.accounts?.id ?? null;
  }
}
