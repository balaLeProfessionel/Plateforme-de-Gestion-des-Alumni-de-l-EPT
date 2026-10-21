import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal, ElementRef, Injector } from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { Observable, firstValueFrom } from 'rxjs';
import { focaliserPremiereErreur } from '../../../../shared/formulaires/focus-premiere-erreur';
import { MentoratService } from '../../../../core/services/mentorat/mentorat';
import {
  LIBELLES_MODALITE,
  ModaliteSeance,
  SeanceMentorat,
  StatutSeance,
} from '../../../../core/services/models/mentorat.model';

const DUREES = [30, 45, 60, 90, 120];

@Component({
  selector: 'app-seances-mentorat',
  imports: [DatePipe, FormField],
  templateUrl: './seances-mentorat.html',
  styleUrl: './seances-mentorat.scss',
})
export class SeancesMentorat {
  private readonly mentoratService = inject(MentoratService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly mentoratId = input.required<string>();
  readonly seances = input.required<SeanceMentorat[]>();
  /** Faux quand le mentorat n’est pas (ou plus) en cours : l’historique reste consultable. */
  readonly modifiable = input(false);
  readonly modifiee = output<void>();

  protected readonly durees = DUREES;
  protected readonly modalites = Object.entries(LIBELLES_MODALITE) as [ModaliteSeance, string][];
  protected readonly libellesModalite = LIBELLES_MODALITE;
  protected readonly formulaireOuvert = signal(false);
  protected readonly envoiEnCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  /** Séance dont on rédige le compte rendu. */
  protected readonly suiviOuvert = signal<string | null>(null);
  protected readonly suivi = signal({ compteRendu: '' });
  protected readonly formulaireSuivi = form(this.suivi, (champ) => {
    maxLength(champ.compteRendu, 4000, { message: '4 000 caractères au maximum.' });
  });

  protected readonly aVenir = computed(() => this.seances()
    .filter((seance) => seance.statut === 'PLANIFIEE')
    .sort((a, b) => a.debut.localeCompare(b.debut)));
  protected readonly historique = computed(() => this.seances().filter((seance) => seance.statut !== 'PLANIFIEE'));

  protected readonly modele = signal({ debut: '', dureeMinutes: '45', modalite: 'VISIO' as ModaliteSeance, lieuOuLien: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.debut, { message: 'Indiquez la date et l’heure.' });
    maxLength(champ.lieuOuLien, 500, { message: '500 caractères au maximum.' });
    validate(champ.debut, ({ value }) => value() && Number.isNaN(new Date(value()).getTime())
      ? { kind: 'date', message: 'Date invalide.' }
      : undefined);
  });

  protected ouvrirFormulaire(): void {
    this.modele.set({ debut: '', dureeMinutes: '45', modalite: 'VISIO', lieuOuLien: '' });
    this.formulaire().reset();
    this.messageErreur.set(null);
    this.formulaireOuvert.set(true);
  }

  protected async planifier(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.formulaire, {
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
      action: async () => {
        if (this.envoiEnCours()) return undefined;
        const { debut, dureeMinutes, modalite, lieuOuLien } = this.modele();
        await this.executer(this.mentoratService.planifierSeance(this.mentoratId(), {
          debut: new Date(debut).toISOString(),
          dureeMinutes: Number(dureeMinutes),
          modalite,
          lieuOuLien: lieuOuLien.trim() || null,
        }));
        if (!this.messageErreur()) this.formulaireOuvert.set(false);
        return undefined;
      },
    });
  }

  protected ouvrirSuivi(seance: SeanceMentorat): void {
    this.suivi.set({ compteRendu: seance.compteRendu ?? '' });
    this.messageErreur.set(null);
    this.suiviOuvert.set(seance.id);
  }

  protected async changerStatut(seance: SeanceMentorat, statut: StatutSeance): Promise<void> {
    if (this.formulaireSuivi().invalid()) return;
    const texte = statut === 'REALISEE' ? this.suivi().compteRendu.trim() || null : null;
    await this.executer(this.mentoratService.suivreSeance(this.mentoratId(), seance.id, statut, texte));
    if (!this.messageErreur()) this.suiviOuvert.set(null);
  }

  protected lienExterne(valeur: string | null): string | null {
    return valeur && /^https:\/\//i.test(valeur) ? valeur : null;
  }

  private async executer(requete: Observable<unknown>): Promise<void> {
    this.envoiEnCours.set(true);
    this.messageErreur.set(null);
    try {
      await firstValueFrom(requete);
      this.modifiee.emit();
    } catch (erreur) {
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message
        : 'L’action n’a pas pu aboutir. Réessayez.');
    } finally {
      this.envoiEnCours.set(false);
    }
  }
}
