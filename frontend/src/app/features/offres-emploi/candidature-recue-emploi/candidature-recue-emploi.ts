import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormField, form, maxLength, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import {
  ACTIONS_STATUT_CANDIDATURE, CandidatureRecueEmploi, LIBELLES_STATUT_CANDIDATURE_EMPLOI, LONGUEUR_NOTE_PRIVEE, StatutCandidatureEmploi,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { enregistrerFichier } from '../../../shared/telecharger';

/** Décisions définitives : le recruteur confirme avant que le candidat soit prévenu. */
const DEFINITIFS: readonly StatutCandidatureEmploi[] = ['RETENUE', 'NON_RETENUE'];

/**
 * Une candidature reçue, vue par le recruteur (#223) : profil du candidat, CV, lettre et réponses, décision, note privée
 * et historique. Chaque changement est renvoyé au parent par `modifiee`.
 */
@Component({
  selector: 'app-candidature-recue-emploi',
  imports: [DatePipe, FormField],
  templateUrl: './candidature-recue-emploi.html',
  styleUrl: './candidature-recue-emploi.scss',
})
export class CarteCandidatureRecue {
  private readonly service = inject(OffresEmploiService);
  private readonly document = inject(DOCUMENT);

  readonly candidature = input.required<CandidatureRecueEmploi>();
  /** Recrutement clôturé : plus aucune décision possible. */
  readonly cloturee = input(false);
  readonly modifiee = output<CandidatureRecueEmploi>();

  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_EMPLOI;
  protected readonly actions = ACTIONS_STATUT_CANDIDATURE;
  protected readonly longueurNote = LONGUEUR_NOTE_PRIVEE;
  protected readonly aConfirmer = signal<StatutCandidatureEmploi | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected readonly profil = computed(() => {
    const c = this.candidature().candidat;
    const role = c.role === 'ALUMNI' ? 'Alumni' : 'Étudiant';
    const promo = c.role === 'ALUMNI'
      ? (c.anneeSortie ? `promo ${c.anneeSortie}` : null)
      : [c.classe, c.anneeEntree ? `entré en ${c.anneeEntree}` : null].filter(Boolean).join(', ') || null;
    return [role, c.filiere, promo].filter(Boolean).join(' · ');
  });
  protected readonly initiales = computed(() => {
    const c = this.candidature().candidat;
    return `${c.prenom?.[0] ?? ''}${c.nom?.[0] ?? ''}`.toUpperCase();
  });
  protected readonly decisions = computed(() => (this.cloturee() ? [] : this.candidature().statutsSuivants));

  /** La note suit la candidature reçue du serveur, et reste modifiable localement. */
  protected readonly modele = linkedSignal(() => ({ note: this.candidature().notePrivee ?? '' }));
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.note, LONGUEUR_NOTE_PRIVEE, { message: `${LONGUEUR_NOTE_PRIVEE} caractères au maximum.` });
  });

  protected choisir(statut: StatutCandidatureEmploi): void {
    this.message.set(null);
    if (DEFINITIFS.includes(statut)) {
      this.aConfirmer.set(statut);
      return;
    }
    this.appliquer(statut);
  }

  protected appliquer(statut: StatutCandidatureEmploi): void {
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.changerStatutCandidature(this.candidature().id, statut).subscribe({
      next: (maj) => {
        this.enCours.set(false);
        this.aConfirmer.set(null);
        this.message.set(`Statut « ${this.statuts[maj.statut]} » enregistré : le candidat est prévenu par une notification.`);
        this.modifiee.emit(maj);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'Le changement a échoué. Réessayez.');
      },
    });
  }

  protected async enregistrerNote(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.erreur.set(null);
    this.message.set(null);
    await submit(this.formulaire, {
      action: async () => {
        try {
          const maj = await firstValueFrom(this.service.enregistrerNote(this.candidature().id, this.modele().note));
          this.message.set('Note enregistrée.');
          this.modifiee.emit(maj);
        } catch (erreur) {
          this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message : 'La note n’a pas pu être enregistrée. Réessayez.');
        }
        return undefined;
      },
    });
  }

  protected telechargerCv(): void {
    const c = this.candidature();
    this.service.telechargerCv(c.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, c.nomCv),
      error: () => this.erreur.set('Le CV n’a pas pu être téléchargé. Réessayez.'),
    });
  }
}
