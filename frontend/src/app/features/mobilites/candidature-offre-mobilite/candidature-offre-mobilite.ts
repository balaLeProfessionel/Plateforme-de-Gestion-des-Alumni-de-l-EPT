import { DatePipe, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CandidatureMobilite, LIBELLES_PIECE, LIBELLES_STATUT_CANDIDATURE_MOBILITE, OffreMobilite, POIDS_MAX_PIECE_MOBILITE, TypePiece,
} from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { TaillePipe } from '../../../shared/taille-fichier';
import { enregistrerFichier } from '../../../shared/telecharger';

/**
 * Dossier de candidature d’un étudiant ou d’un enseignant éligible : un PDF par pièce demandée. Tant que l’offre est
 * ouverte, il remplace une pièce, retire sa candidature ou la renvoie avec les pièces déjà déposées.
 */
@Component({
  selector: 'app-candidature-offre-mobilite',
  imports: [DatePipe, RouterLink, TaillePipe],
  templateUrl: './candidature-offre-mobilite.html',
  styleUrl: './candidature-offre-mobilite.scss',
})
export class CandidatureOffreMobilite implements OnInit {
  private readonly service = inject(OffresMobiliteService);
  private readonly document = inject(DOCUMENT);

  readonly offre = input.required<OffreMobilite>();

  protected readonly libellesPiece = LIBELLES_PIECE;
  protected readonly statuts = LIBELLES_STATUT_CANDIDATURE_MOBILITE;
  protected readonly candidature = signal<CandidatureMobilite | null>(null);
  protected readonly chargee = signal(false);
  /** Fichiers choisis, pas encore envoyés. */
  protected readonly choisis = signal<Partial<Record<TypePiece, File>>>({});
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly confirmerRetrait = signal(false);

  protected readonly envoyee = computed(() => this.candidature()?.statut === 'SOUMISE');
  /** Le formulaire s’affiche pour un premier dépôt, un renvoi, ou des pièces choisies en remplacement. */
  protected readonly peutDeposer = computed(() => {
    const c = this.candidature();
    return this.offre().candidaturesOuvertes && (!c || c.modifiable);
  });
  protected readonly manquantes = computed(() => {
    const deposees = new Set(this.candidature()?.pieces.map((p) => p.type) ?? []);
    return this.offre().piecesDemandees.filter((type) => !deposees.has(type) && !this.choisis()[type]);
  });
  protected readonly rienAEnvoyer = computed(() => this.envoyee() && Object.keys(this.choisis()).length === 0);

  ngOnInit(): void {
    this.service.maCandidature(this.offre().id).subscribe({
      next: (candidature) => {
        this.candidature.set(candidature);
        this.chargee.set(true);
      },
      error: () => {
        this.erreur.set('Votre candidature n’a pas pu être chargée.');
        this.chargee.set(true);
      },
    });
  }

  protected deposee(type: TypePiece) {
    return this.candidature()?.pieces.find((p) => p.type === type) ?? null;
  }

  protected choisir(type: TypePiece, evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) return;
    this.erreur.set(null);
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      this.erreur.set(`« ${fichier.name} » n’est pas un PDF.`);
      return;
    }
    if (fichier.size > POIDS_MAX_PIECE_MOBILITE) {
      this.erreur.set(`« ${fichier.name} » dépasse 5 Mo.`);
      return;
    }
    this.choisis.update((liste) => ({ ...liste, [type]: fichier }));
  }

  protected oublier(type: TypePiece): void {
    this.choisis.update((liste) => {
      const copie = { ...liste };
      delete copie[type];
      return copie;
    });
  }

  protected envoyer(): void {
    if (this.enCours()) return;
    if (this.manquantes().length) {
      this.erreur.set(`Il manque : ${this.manquantes().map((t) => this.libellesPiece[t].toLowerCase()).join(', ')}.`);
      return;
    }
    const renvoi = this.candidature()?.statut === 'RETIREE';
    const remplacement = this.envoyee();
    this.executer(this.service.soumettre(this.offre().id, this.choisis()),
      remplacement ? 'Les pièces sont remplacées.' : renvoi ? 'Votre candidature est de nouveau envoyée.' : 'Votre candidature est envoyée.');
  }

  protected retirer(): void {
    this.executer(this.service.retirerCandidature(this.offre().id), 'Votre candidature est retirée. Vous pouvez la renvoyer jusqu’à la date limite.');
  }

  protected telecharger(piece: CandidatureMobilite['pieces'][number]): void {
    const candidature = this.candidature();
    if (!candidature) return;
    this.service.telechargerPieceCandidature(candidature.id, piece.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, piece.nom),
      error: () => this.erreur.set(`« ${piece.nom} » n’a pas pu être téléchargé. Réessayez.`),
    });
  }

  private executer(requete: ReturnType<OffresMobiliteService['retirerCandidature']>, message: string): void {
    this.enCours.set(true);
    this.erreur.set(null);
    this.message.set(null);
    requete.subscribe({
      next: (candidature) => {
        this.enCours.set(false);
        this.candidature.set(candidature);
        this.choisis.set({});
        this.confirmerRetrait.set(false);
        this.message.set(message);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’envoi a échoué. Réessayez.');
      },
    });
  }
}
