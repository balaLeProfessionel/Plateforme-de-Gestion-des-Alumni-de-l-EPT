import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { LiaisonGoogle } from '../../../core/services/models/liaison-google.model';
import { MessageSection } from '../../profil/composants/message-section.model';
import { BoutonGoogle } from '../bouton-google/bouton-google';

function messageServeur(err: HttpErrorResponse, secours: string): string {
  const message: unknown = err?.error?.message;
  return typeof message === 'string' && message ? message : secours;
}

/**
 * Compte Google lié au compte connecté : le lier (même avec une autre adresse) ou le délier.
 * Délier n'est proposé qu'avec un mot de passe connu, sinon la personne perdrait tout accès.
 */
@Component({
  selector: 'app-section-google',
  imports: [BoutonGoogle, RouterLink],
  templateUrl: './section-google.html',
  styleUrl: './section-google.scss',
})
export class SectionGoogle {
  private readonly authService = inject(AuthService);

  protected readonly liaison = signal<LiaisonGoogle | null>(null);
  protected readonly erreurChargement = signal(false);
  protected readonly enCours = signal(false);
  protected readonly confirmation = signal(false);
  protected readonly message = signal<MessageSection | null>(null);

  constructor() {
    this.charger();
  }

  protected charger() {
    this.erreurChargement.set(false);
    this.authService.liaisonGoogle().subscribe({
      next: (liaison) => this.liaison.set(liaison),
      error: () => this.erreurChargement.set(true),
    });
  }

  protected lier(credential: string) {
    this.enCours.set(true);
    this.message.set(null);
    this.authService.lierGoogle(credential).subscribe({
      next: (liaison) => {
        this.enCours.set(false);
        this.liaison.set(liaison);
        this.message.set({ type: 'succes', texte: 'Compte Google lié. Vous pouvez maintenant l’utiliser pour vous connecter.' });
      },
      error: (err: HttpErrorResponse) => {
        this.enCours.set(false);
        this.message.set({ type: 'erreur', texte: messageServeur(err, 'La liaison avec Google a échoué. Réessayez.') });
      },
    });
  }

  protected delier() {
    this.enCours.set(true);
    this.message.set(null);
    this.authService.delierGoogle().subscribe({
      next: (liaison) => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.liaison.set(liaison);
        this.message.set({ type: 'succes', texte: 'Compte Google délié. Connectez-vous désormais avec votre mot de passe.' });
      },
      error: (err: HttpErrorResponse) => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.message.set({ type: 'erreur', texte: messageServeur(err, 'Impossible de délier Google pour le moment. Réessayez.') });
      },
    });
  }

  protected erreurGoogle(texte: string) {
    this.message.set({ type: 'erreur', texte });
  }
}
