import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Convention, PieceConvention, PIECES_CONVENTION_MAX, POIDS_MAX_PIECE_CONVENTION,
} from '../../../core/services/models/partenariat.model';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { TaillePipe } from '../../../shared/taille-fichier';
import { enregistrerFichier } from '../../../shared/telecharger';

/**
 * Documents PDF d’une convention, 10 au plus. `ajoutable` vient de la page (l’organisme dépose pendant sa demande,
 * le service à tout moment) ; le serveur dit pour chaque document s’il peut être retiré.
 */
@Component({
  selector: 'app-pieces-convention',
  imports: [TaillePipe],
  templateUrl: './pieces-convention.html',
  styleUrl: '../../stages/fichiers-offre/fichiers-offre.scss',
})
export class PiecesConvention {
  private readonly service = inject(ConventionsPartenariatService);
  private readonly document = inject(DOCUMENT);

  readonly convention = input.required<Convention>();
  readonly admin = input(false);
  readonly ajoutable = input(false);
  readonly modifiee = output<Convention>();

  protected readonly piecesMax = PIECES_CONVENTION_MAX;
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  protected telecharger(piece: PieceConvention): void {
    this.erreur.set(null);
    this.service.telechargerPiece(this.convention().id, piece.id, this.admin()).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, piece.nomFichier),
      error: () => this.erreur.set(`« ${piece.nomFichier} » n’a pas pu être téléchargé. Réessayez.`),
    });
  }

  protected ajouter(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) return;
    if (fichier.type !== 'application/pdf' || !fichier.name.toLowerCase().endsWith('.pdf')) {
      this.erreur.set('Seuls les fichiers PDF sont acceptés.');
      return;
    }
    if (fichier.size > POIDS_MAX_PIECE_CONVENTION) {
      this.erreur.set('Le fichier ne doit pas dépasser 5 Mo.');
      return;
    }
    this.executer(this.service.ajouterPiece(this.convention().id, fichier, this.admin()), `« ${fichier.name} » est joint au dossier.`);
  }

  protected retirer(piece: PieceConvention): void {
    this.executer(this.service.supprimerPiece(this.convention().id, piece.id, this.admin()), `« ${piece.nomFichier} » est retiré du dossier.`);
  }

  private executer(requete: Observable<Convention>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    this.message.set(null);
    requete.subscribe({
      next: (convention) => {
        this.enCours.set(false);
        this.message.set(message);
        this.modifiee.emit(convention);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’envoi a échoué. Réessayez.');
      },
    });
  }
}
