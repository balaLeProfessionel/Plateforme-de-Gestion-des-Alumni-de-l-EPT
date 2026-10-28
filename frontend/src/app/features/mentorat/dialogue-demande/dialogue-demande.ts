import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, effect, inject, input, output, signal, viewChild, Injector } from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { MentoratService } from '../../../core/services/mentorat/mentorat';
import { Mentor, Mentorat, ProgrammeResume } from '../../../core/services/models/mentorat.model';

const LONGUEUR_OBJECTIF = 1000;

/** Fenêtre modale native : focus piégé, Échap et retour du focus gérés par le navigateur. */
@Component({
  selector: 'app-dialogue-demande',
  imports: [FormField],
  templateUrl: './dialogue-demande.html',
  styleUrl: './dialogue-demande.scss',
})
export class DialogueDemande {
  private readonly mentoratService = inject(MentoratService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  /** Le mentor sollicité ; null ferme la fenêtre. */
  readonly mentor = input<Mentor | null>(null);
  /** Demande faite depuis la page d’un programme : elle lui est rattachée. */
  readonly programme = input<ProgrammeResume | null>(null);
  readonly envoyee = output<Mentorat>();
  readonly fermee = output<void>();

  protected readonly longueurObjectif = LONGUEUR_OBJECTIF;
  protected readonly envoiEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly modele = signal({ domaineId: '', objectif: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.domaineId, { message: 'Choisissez un domaine.' });
    required(champ.objectif, { message: 'Décrivez ce que vous attendez de ce mentorat.' });
    maxLength(champ.objectif, LONGUEUR_OBJECTIF, { message: 'L’objectif ne peut pas dépasser 1 000 caractères.' });
    validate(champ.objectif, ({ value }) => value().trim().length === 0
      ? { kind: 'blank', message: 'Décrivez ce que vous attendez de ce mentorat.' }
      : undefined);
  });

  constructor() {
    effect(() => {
      const mentor = this.mentor();
      const dialogue = this.dialogue().nativeElement;
      if (mentor) {
        const domaineUnique = mentor.domaines.length === 1 ? mentor.domaines[0].id : '';
        this.modele.set({ domaineId: domaineUnique, objectif: '' });
        this.formulaire().reset();
        this.messageErreur.set(null);
        if (!dialogue.open) dialogue.showModal();
      } else if (dialogue.open) {
        dialogue.close();
      }
    });
  }

  protected async envoyer(event: Event): Promise<void> {
    event.preventDefault();
    const mentor = this.mentor();
    if (!mentor || this.envoiEnCours()) return;
    await submit(this.formulaire, {
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
      action: async () => {
        this.envoiEnCours.set(true);
        this.messageErreur.set(null);
        try {
          const { domaineId, objectif } = this.modele();
          const mentorat = await firstValueFrom(
            this.mentoratService.demander(mentor.profilId, domaineId, objectif.trim(), this.programme()?.id ?? null));
          this.envoyee.emit(mentorat);
        } catch (erreur) {
          this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message
            : 'La demande n’a pas pu être envoyée. Réessayez.');
        } finally {
          this.envoiEnCours.set(false);
        }
        return undefined;
      },
    });
  }

  protected fermer(): void {
    this.dialogue().nativeElement.close();
  }
}
