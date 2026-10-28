import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal, ElementRef, Injector } from '@angular/core';
import { FormField, form, maxLength, min, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { focaliserPremiereErreur } from '../../../../shared/formulaires/focus-premiere-erreur';
import { MentoratService } from '../../../../core/services/mentorat/mentorat';
import { EvaluationMentorat } from '../../../../core/services/models/mentorat.model';

@Component({
  selector: 'app-evaluation-mentorat',
  imports: [FormField],
  templateUrl: './evaluation-mentorat.html',
  styleUrl: './evaluation-mentorat.scss',
})
export class EvaluationMentoratCarte {
  private readonly mentoratService = inject(MentoratService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly mentoratId = input.required<string>();
  readonly evaluations = input.required<EvaluationMentorat[]>();
  readonly peutEvaluer = input(false);
  readonly termine = input(false);
  readonly moi = input.required<string>();
  readonly evaluee = output<void>();

  protected readonly notes = [1, 2, 3, 4, 5];
  protected readonly envoiEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly modele = signal({ note: 0, commentaire: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    min(champ.note, 1, { message: 'Choisissez une note de 1 à 5.' });
    maxLength(champ.commentaire, 1000, { message: '1 000 caractères au maximum.' });
  });

  protected readonly maNote = computed(() => this.evaluations().find((e) => e.auteurId === this.moi()) ?? null);
  protected readonly autreNote = computed(() => this.evaluations().find((e) => e.auteurId !== this.moi()) ?? null);

  protected choisirNote(note: number): void {
    this.modele.update((valeurs) => ({ ...valeurs, note }));
    this.formulaire.note().markAsTouched();
  }

  protected async envoyer(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.formulaire, {
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
      action: async () => {
        if (this.envoiEnCours()) return undefined;
        this.envoiEnCours.set(true);
        this.messageErreur.set(null);
        try {
          const { note, commentaire } = this.modele();
          await firstValueFrom(this.mentoratService.evaluer(this.mentoratId(), note, commentaire.trim() || null));
          this.evaluee.emit();
        } catch (erreur) {
          this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message
            : 'L’évaluation n’a pas pu être envoyée.');
        } finally {
          this.envoiEnCours.set(false);
        }
        return undefined;
      },
    });
  }
}
