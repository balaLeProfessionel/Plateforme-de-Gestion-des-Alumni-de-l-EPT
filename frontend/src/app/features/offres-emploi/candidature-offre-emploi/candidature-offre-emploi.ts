import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, OnInit, signal, viewChild } from '@angular/core';
import { applyEach, FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  DernierCv, LIBELLES_STATUT_CANDIDATURE_EMPLOI, LONGUEUR_LETTRE_EMPLOI, LONGUEUR_REPONSE, MaCandidatureEmploi, OffreEmploi, POIDS_MAX_CV,
} from '../../../core/services/models/offre-emploi.model';
import { OffresEmploiService } from '../../../core/services/offres-emploi/offres-emploi';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { enregistrerFichier } from '../../../shared/telecharger';

type ChoixCv = 'nouveau' | 'dernier' | 'garder';

/**
 * Candidature d’un étudiant ou d’un alumni à une offre gérée (#222) : CV en PDF (nouveau ou repris de sa dernière
 * candidature), lettre facultative ou exigée, réponses aux questions du recruteur. Il suit ensuite son statut et peut
 * retirer sa candidature tant qu’elle n’est pas traitée.
 */
@Component({
  selector: 'app-candidature-offre-emploi',
  imports: [DatePipe, FormField, RouterLink],
  templateUrl: './candidature-offre-emploi.html',
  styleUrl: './candidature-offre-emploi.scss',
})
export class CandidatureOffreEmploi implements OnInit {
  private readonly service = inject(OffresEmploiService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly offre = input.required<OffreEmploi>();

  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_EMPLOI;
  protected readonly longueurLettre = LONGUEUR_LETTRE_EMPLOI;
  protected readonly candidature = signal<MaCandidatureEmploi | null>(null);
  protected readonly dernierCv = signal<DernierCv | null>(null);
  protected readonly chargee = signal(false);
  protected readonly erreurChargement = signal(false);
  protected readonly choixCv = signal<ChoixCv>('nouveau');
  protected readonly fichierCv = signal<File | null>(null);
  protected readonly erreurCv = signal<string | null>(null);
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly confirmationRetrait = signal(false);
  protected readonly retraitEnCours = signal(false);

  protected readonly modele = signal({ lettre: '', reponses: [] as string[] });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.lettre, { when: () => this.offre().lettreExigee, message: 'Cette offre exige une lettre de motivation.' });
    maxLength(champ.lettre, LONGUEUR_LETTRE_EMPLOI, { message: `${LONGUEUR_LETTRE_EMPLOI} caractères au maximum.` });
    applyEach(champ.reponses, (reponse) => {
      required(reponse, {
        when: ({ index }) => this.offre().questions[index()]?.obligatoire ?? false,
        message: 'Répondez à cette question.',
      });
      maxLength(reponse, LONGUEUR_REPONSE, { message: `${LONGUEUR_REPONSE} caractères au maximum.` });
    });
  });

  /** Le formulaire s’affiche pour un premier envoi, ou un renvoi après retrait, tant que l’offre est ouverte. */
  protected readonly peutEnvoyer = computed(() => {
    const offre = this.offre();
    const statut = this.candidature()?.statut;
    return offre.statut === 'PUBLIEE' && !offre.expiree && !offre.cloturee && (!statut || statut === 'RETIREE');
  });
  private readonly zoneEtat = viewChild<ElementRef<HTMLElement>>('zoneEtat');

  ngOnInit(): void {
    const offre = this.offre();
    this.modele.set({ lettre: '', reponses: offre.questions.map(() => '') });
    this.service.maCandidature(offre.id).subscribe({
      next: (candidature) => {
        this.candidature.set(candidature);
        if (candidature) this.choixCv.set('garder');
        this.chargee.set(true);
      },
      error: () => this.erreurChargement.set(true),
    });
    this.service.dernierCv().subscribe({
      next: (cv) => {
        this.dernierCv.set(cv);
        if (cv && !this.candidature()) this.choixCv.set('dernier');
      },
      error: () => this.dernierCv.set(null),
    });
  }

  protected choisirCv(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0] ?? null;
    this.erreurCv.set(null);
    if (!fichier) return;
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      champ.value = '';
      this.erreurCv.set('Votre CV doit être un fichier PDF.');
      return;
    }
    if (fichier.size > POIDS_MAX_CV) {
      champ.value = '';
      this.erreurCv.set('Votre CV ne doit pas dépasser 5 Mo.');
      return;
    }
    this.fichierCv.set(fichier);
  }

  protected repondreOuiNon(index: number, valeur: 'OUI' | 'NON'): void {
    this.modele.update((m) => ({ ...m, reponses: m.reponses.map((r, i) => (i === index ? valeur : r)) }));
    this.formulaire.reponses[index]().markAsTouched();
  }

  protected async envoyer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.erreur.set(null);
    const cvManquant = this.choixCv() === 'nouveau' && !this.fichierCv();
    this.erreurCv.set(cvManquant ? 'Joignez votre CV en PDF.' : null);
    await submit(this.formulaire, {
      action: async () => {
        if (cvManquant) {
          this.hote.nativeElement.querySelector<HTMLElement>('#candidature-cv')?.focus();
          return undefined;
        }
        const { lettre, reponses } = this.modele();
        const questions = this.offre().questions;
        try {
          const candidature = await firstValueFrom(this.service.postuler(this.offre().id, {
            cv: this.choixCv() === 'nouveau' ? this.fichierCv() : null,
            reprendreCv: this.choixCv() === 'dernier',
            lettre,
            reponses: questions.map((q, i) => ({ questionId: q.id, valeur: reponses[i]?.trim() ?? '' })).filter((r) => r.valeur),
          }));
          const renvoi = this.candidature() !== null;
          this.apresChangement(candidature, renvoi ? 'Votre candidature est renvoyée.' : 'Votre candidature est envoyée.');
        } catch (erreur) {
          this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
            ? erreur.error.message : 'L’envoi a échoué. Réessayez.');
        }
        return undefined;
      },
      onInvalid: () => focaliserPremiereErreur(this.hote.nativeElement, this.injector),
    });
  }

  protected retirer(): void {
    this.retraitEnCours.set(true);
    this.erreur.set(null);
    this.service.retirerCandidature(this.offre().id).subscribe({
      next: (candidature) => {
        this.retraitEnCours.set(false);
        this.apresChangement(candidature, 'Votre candidature est retirée. Vous pouvez la renvoyer tant que l’offre est ouverte.');
      },
      error: (erreur: HttpErrorResponse) => {
        this.retraitEnCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'Le retrait a échoué. Réessayez.');
      },
    });
  }

  protected telechargerCv(candidature: MaCandidatureEmploi): void {
    this.service.telechargerCv(candidature.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, candidature.nomCv),
      error: () => this.erreur.set('Le CV n’a pas pu être téléchargé. Réessayez.'),
    });
  }

  private apresChangement(candidature: MaCandidatureEmploi, message: string): void {
    this.candidature.set(candidature);
    this.fichierCv.set(null);
    this.choixCv.set('garder');
    this.confirmationRetrait.set(false);
    this.message.set(message);
    afterNextRender(() => this.zoneEtat()?.nativeElement.focus(), { injector: this.injector });
  }
}
