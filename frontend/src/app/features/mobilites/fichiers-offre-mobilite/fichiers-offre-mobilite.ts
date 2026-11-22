import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { OffreMobilite, PIECES_OFFRE_MOBILITE_MAX, POIDS_MAX_PIECE_MOBILITE } from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { TaillePipe } from '../../../shared/taille-fichier';
import { enregistrerFichier } from '../../../shared/telecharger';

type Piece = OffreMobilite['piecesJointes'][number];

/**
 * Documents PDF d’une offre de mobilité, téléchargeables par qui la voit. Son institut et le chef du service mobilité
 * en ajoutent ou en retirent, 5 au plus.
 */
@Component({
  selector: 'app-fichiers-offre-mobilite',
  imports: [TaillePipe],
  templateUrl: './fichiers-offre-mobilite.html',
  styleUrl: '../../stages/fichiers-offre/fichiers-offre.scss',
})
export class FichiersOffreMobilite {
  private readonly service = inject(OffresMobiliteService);
  private readonly document = inject(DOCUMENT);

  readonly offre = input.required<OffreMobilite>();
  readonly modifiee = output<OffreMobilite>();

  protected readonly piecesMax = PIECES_OFFRE_MOBILITE_MAX;
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected telecharger(piece: Piece): void {
    this.erreur.set(null);
    this.service.telechargerPiece(this.offre().id, piece.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, piece.nom),
      error: () => this.erreur.set(`« ${piece.nom} » n’a pas pu être téléchargé. Réessayez.`),
    });
  }

  protected ajouterPiece(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) return;
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      this.erreur.set('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (fichier.size > POIDS_MAX_PIECE_MOBILITE) {
      this.erreur.set('Le fichier ne doit pas dépasser 5 Mo.');
      return;
    }
    this.executer(this.service.ajouterPiece(this.offre().id, fichier), `« ${fichier.name} » est jointe à l’offre.`);
  }

  protected retirerPiece(piece: Piece): void {
    this.executer(this.service.supprimerPiece(this.offre().id, piece.id), `« ${piece.nom} » est retirée de l’offre.`);
  }

  private executer(requete: Observable<OffreMobilite>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.message.set(null);
    requete.subscribe({
      next: (offre) => {
        this.enCours.set(false);
        this.message.set(message);
        this.modifiee.emit(offre);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’envoi a échoué. Réessayez.');
      },
    });
  }
}
