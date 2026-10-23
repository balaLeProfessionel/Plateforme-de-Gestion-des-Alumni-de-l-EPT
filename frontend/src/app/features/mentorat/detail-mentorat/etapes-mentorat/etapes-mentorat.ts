import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormField, form, maxLength, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { MentoratService } from '../../../../core/services/mentorat/mentorat';
import { EtapeSuivie, ProgrammeResume } from '../../../../core/services/models/mentorat.model';

const LONGUEUR_COMMENTAIRE = 500;

/** Étapes du programme dans le suivi : le mentor ou le mentoré les valide, dans l’ordre qui lui convient. */
@Component({
  selector: 'app-etapes-mentorat',
  imports: [DatePipe, FormField, RouterLink],
  templateUrl: './etapes-mentorat.html',
  styleUrl: './etapes-mentorat.scss',
})
export class EtapesMentorat {
  private readonly mentoratService = inject(MentoratService);

  readonly mentoratId = input.required<string>();
  readonly programme = input.required<ProgrammeResume>();
  readonly etapes = input.required<EtapeSuivie[]>();
  /** Faux quand le mentorat n’est pas (ou plus) en cours : l’avancement reste consultable. */
  readonly modifiable = input(false);
  readonly modifiee = output<void>();

  protected readonly longueurCommentaire = LONGUEUR_COMMENTAIRE;
  protected readonly franchies = computed(() => this.etapes().filter((etape) => etape.franchieLe).length);
  /** Étape dont on confirme la validation. */
  protected readonly enValidation = signal<string | null>(null);
  protected readonly envoiEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly saisie = signal({ commentaire: '' });
  protected readonly formulaire = form(this.saisie, (champ) => {
    maxLength(champ.commentaire, LONGUEUR_COMMENTAIRE, { message: '500 caractères au maximum.' });
  });

  protected ouvrirValidation(etapeId: string): void {
    this.saisie.set({ commentaire: '' });
    this.formulaire().reset();
    this.messageErreur.set(null);
    this.enValidation.set(etapeId);
  }

  protected async valider(event: Event, etapeId: string): Promise<void> {
    event.preventDefault();
    await submit(this.formulaire, async () => {
      const commentaire = this.saisie().commentaire.trim();
      await this.executer(this.mentoratService.validerEtape(this.mentoratId(), etapeId, commentaire || null));
      return undefined;
    });
  }

  protected annulerValidation(etapeId: string): Promise<void> {
    return this.executer(this.mentoratService.annulerValidationEtape(this.mentoratId(), etapeId));
  }

  private async executer(action: Observable<EtapeSuivie>): Promise<void> {
    if (this.envoiEnCours()) return;
    this.envoiEnCours.set(true);
    this.messageErreur.set(null);
    try {
      await firstValueFrom(action);
      this.enValidation.set(null);
      this.modifiee.emit();
    } catch (erreur) {
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message
        : 'L’action n’a pas abouti. Réessayez.');
    } finally {
      this.envoiEnCours.set(false);
    }
  }
}
