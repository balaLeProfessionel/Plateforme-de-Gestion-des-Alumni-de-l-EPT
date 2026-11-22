import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, OnInit, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LONGUEUR_LETTRE, MaCandidature, OffreStage, POIDS_MAX_PIECE } from '../../../core/services/models/stage.model';
import { CandidaturesService } from '../../../core/services/stages/candidatures';
import { enregistrerFichier } from '../../../shared/telecharger';

/**
 * Candidature de l’étudiant à l’offre (STA-03) : postuler avec un CV PDF et une lettre facultative, suivre l’envoi,
 * retirer puis renvoyer avant la date limite. L’avis de l’organisme ne lui est jamais montré.
 */
@Component({
  selector: 'app-candidature-offre',
  imports: [DatePipe, RouterLink],
  templateUrl: './candidature-offre.html',
  styleUrl: './candidature-offre.scss',
})
export class CandidatureOffre implements OnInit {
  private readonly service = inject(CandidaturesService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  readonly offre = input.required<OffreStage>();

  protected readonly longueurLettre = LONGUEUR_LETTRE;
  protected readonly candidature = signal<MaCandidature | null>(null);
  protected readonly chargee = signal(false);
  protected readonly erreurChargement = signal(false);
  protected readonly cv = signal<File | null>(null);
  protected readonly lettre = signal('');
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly confirmationRetrait = signal(false);
  protected readonly message = signal<string | null>(null);
  /** Le formulaire s’affiche pour un premier envoi ou un renvoi, tant que les candidatures sont ouvertes. */
  protected readonly peutEnvoyer = computed(() => this.offre().candidaturesOuvertes && this.candidature()?.statut !== 'ENVOYEE');
  private readonly zoneEtat = viewChild<ElementRef<HTMLElement>>('zoneEtat');

  ngOnInit(): void {
    this.service.maCandidature(this.offre().id).subscribe({
      next: (candidature) => {
        this.candidature.set(candidature);
        this.lettre.set(candidature?.lettreMotivation ?? '');
        this.chargee.set(true);
      },
      error: () => this.erreurChargement.set(true),
    });
  }

  protected choisirCv(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0] ?? null;
    this.erreur.set(null);
    if (!fichier) return;
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      champ.value = '';
      this.erreur.set('Votre CV doit être un fichier PDF.');
      return;
    }
    if (fichier.size > POIDS_MAX_PIECE) {
      champ.value = '';
      this.erreur.set('Votre CV ne doit pas dépasser 5 Mo.');
      return;
    }
    this.cv.set(fichier);
  }

  protected saisirLettre(evenement: Event): void {
    this.lettre.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected envoyer(evenement: Event): void {
    evenement.preventDefault();
    if (this.enCours()) return;
    if (!this.cv() && !this.candidature()) {
      this.erreur.set('Joignez votre CV en PDF.');
      return;
    }
    if (this.lettre().trim().length > LONGUEUR_LETTRE) {
      this.erreur.set(`La lettre de motivation ne doit pas dépasser ${LONGUEUR_LETTRE} caractères.`);
      return;
    }
    const renvoi = this.candidature() !== null;
    this.executer(this.service.postuler(this.offre().id, this.cv(), this.lettre()),
      renvoi ? 'Votre candidature est renvoyée.' : 'Votre candidature est envoyée.');
  }

  protected retirer(): void {
    this.executer(this.service.retirer(this.offre().id), 'Votre candidature est retirée. Vous pouvez la renvoyer jusqu’à la date limite.');
  }

  protected telechargerCv(candidature: MaCandidature): void {
    this.service.telechargerCv(candidature.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, candidature.nomCv),
      error: () => this.erreur.set('Le CV n’a pas pu être téléchargé. Réessayez.'),
    });
  }

  private executer(requete: ReturnType<CandidaturesService['retirer']>, message: string): void {
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (candidature) => {
        this.enCours.set(false);
        this.candidature.set(candidature);
        this.cv.set(null);
        this.confirmationRetrait.set(false);
        this.message.set(message);
        afterNextRender(() => this.zoneEtat()?.nativeElement.focus(), { injector: this.injector });
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’envoi a échoué. Réessayez.');
      },
    });
  }
}
