import { Component, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement } from '../../../core/services/models/evenement';

/** Bloc « Gestion » de la fiche d'un événement : modifier, puis annuler avec confirmation. */
@Component({
  selector: 'app-gestion-evenement',
  imports: [RouterLink],
  templateUrl: './gestion-evenement.html',
  styleUrl: './gestion-evenement.scss'
})
export class GestionEvenement {
  private readonly evenementService = inject(EvenementService);
  protected readonly router = inject(Router);

  readonly evenement = input.required<Evenement>();
  /** Adresse de retour de la fiche, transmise au formulaire de modification. */
  readonly urlRetour = input<string | null>(null);
  /** L'événement tel que renvoyé par le serveur après son annulation. */
  readonly annule = output<Evenement>();

  protected readonly confirmationAnnulation = signal(false);
  protected readonly actionEnCours = signal(false);
  protected readonly erreurAction = signal<string | null>(null);

  protected demanderConfirmationAnnulation(): void {
    this.confirmationAnnulation.set(true);
    this.erreurAction.set(null);
  }

  protected abandonnerAnnulation(): void {
    this.confirmationAnnulation.set(false);
    this.erreurAction.set(null);
  }

  protected async confirmerAnnulation(): Promise<void> {
    if (this.actionEnCours()) return;
    this.actionEnCours.set(true);
    this.erreurAction.set(null);
    try {
      this.annule.emit(await firstValueFrom(this.evenementService.annuler(this.evenement().id)));
      this.confirmationAnnulation.set(false);
    } catch {
      this.erreurAction.set('L’annulation a échoué. Réessayez.');
    } finally {
      this.actionEnCours.set(false);
    }
  }
}
