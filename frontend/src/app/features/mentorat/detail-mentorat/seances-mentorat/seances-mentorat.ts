import { DatePipe, DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal, ElementRef, Injector } from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { Observable, firstValueFrom } from 'rxjs';
import { focaliserPremiereErreur } from '../../../../shared/formulaires/focus-premiere-erreur';
import { MentoratService } from '../../../../core/services/mentorat/mentorat';
import {
  LIBELLES_MODALITE,
  SeanceMentoratRequest,
  ModaliteSeance,
  SeanceMentorat,
  StatutSeance,
} from '../../../../core/services/models/mentorat.model';
import { fichierIcs, nomFichierIcs } from './agenda-seance';

const DUREES = [30, 45, 60, 90, 120];

interface SaisieSeance {
  debut: string;
  dureeMinutes: string;
  modalite: ModaliteSeance;
  lieuOuLien: string;
}

@Component({
  selector: 'app-seances-mentorat',
  imports: [DatePipe, FormField, NgTemplateOutlet],
  templateUrl: './seances-mentorat.html',
  styleUrl: './seances-mentorat.scss',
})
export class SeancesMentorat {
  private readonly mentoratService = inject(MentoratService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  readonly mentoratId = input.required<string>();
  readonly seances = input.required<SeanceMentorat[]>();
  /** Faux quand le mentorat n’est pas (ou plus) en cours : l’historique reste consultable. */
  readonly modifiable = input(false);
  /** Titre de l’événement dans l’agenda, ex. « Mentorat Data & IA avec Awa Thiam ». */
  readonly intitule = input('Séance de mentorat');
  readonly modifiee = output<void>();

  protected readonly modalites = Object.entries(LIBELLES_MODALITE) as [ModaliteSeance, string][];
  protected readonly libellesModalite = LIBELLES_MODALITE;
  protected readonly formulaireOuvert = signal(false);
  /** Séance planifiée en cours de déplacement (null : le formulaire crée une nouvelle séance). */
  protected readonly seanceEnEdition = signal<string | null>(null);
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

  protected readonly modele = signal<SaisieSeance>({ debut: '', dureeMinutes: '45', modalite: 'VISIO', lieuOuLien: '' });
  /** Une séance créée ailleurs peut avoir une durée hors de la liste : on la garde proposée. */
  protected readonly durees = computed(() =>
    [...new Set([...DUREES, Number(this.modele().dureeMinutes)])].sort((a, b) => a - b));
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.debut, { message: 'Indiquez la date et l’heure.' });
    maxLength(champ.lieuOuLien, 500, { message: '500 caractères au maximum.' });
    validate(champ.debut, ({ value }) => value() && Number.isNaN(new Date(value()).getTime())
      ? { kind: 'date', message: 'Date invalide.' }
      : undefined);
  });

  protected ouvrirFormulaire(): void {
    this.preparerFormulaire({ debut: '', dureeMinutes: '45', modalite: 'VISIO', lieuOuLien: '' }, null);
  }

  protected ouvrirModification(seance: SeanceMentorat): void {
    this.suiviOuvert.set(null);
    this.preparerFormulaire({
      debut: saisieLocale(seance.debut),
      dureeMinutes: String(seance.dureeMinutes),
      modalite: seance.modalite,
      lieuOuLien: seance.lieuOuLien ?? '',
    }, seance.id);
  }

  protected fermerFormulaire(): void {
    this.formulaireOuvert.set(false);
    this.seanceEnEdition.set(null);
  }

  protected async enregistrer(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.formulaire, {
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
      action: async () => {
        if (this.envoiEnCours()) return undefined;
        const { debut, dureeMinutes, modalite, lieuOuLien } = this.modele();
        const seance: SeanceMentoratRequest = {
          debut: new Date(debut).toISOString(),
          dureeMinutes: Number(dureeMinutes),
          modalite,
          lieuOuLien: lieuOuLien.trim() || null,
        };
        const enEdition = this.seanceEnEdition();
        await this.executer(enEdition
          ? this.mentoratService.modifierSeance(this.mentoratId(), enEdition, seance)
          : this.mentoratService.planifierSeance(this.mentoratId(), seance));
        if (!this.messageErreur()) this.fermerFormulaire();
        return undefined;
      },
    });
  }

  /** Télécharge la séance au format .ics pour l’ajouter à son agenda. */
  protected ajouterAMonAgenda(seance: SeanceMentorat): void {
    const fenetre = this.document.defaultView;
    if (!fenetre) return;
    const url = fenetre.URL.createObjectURL(new Blob(
      [fichierIcs(seance, this.intitule(), new Date())], { type: 'text/calendar;charset=utf-8' }));
    const lien = this.document.createElement('a');
    lien.href = url;
    lien.download = nomFichierIcs(seance);
    lien.click();
    fenetre.URL.revokeObjectURL(url);
  }

  protected ouvrirSuivi(seance: SeanceMentorat): void {
    this.fermerFormulaire();
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

  private preparerFormulaire(valeurs: SaisieSeance, seanceId: string | null): void {
    this.modele.set(valeurs);
    this.formulaire().reset();
    this.messageErreur.set(null);
    this.seanceEnEdition.set(seanceId);
    this.formulaireOuvert.set(true);
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

/** Valeur d’un champ datetime-local (heure locale, à la minute) pour une date ISO. */
function saisieLocale(iso: string): string {
  const date = new Date(iso);
  const deux = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}T${deux(date.getHours())}:${deux(date.getMinutes())}`;
}
