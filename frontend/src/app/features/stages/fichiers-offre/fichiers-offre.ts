import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, OnDestroy, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { OffreStage, PIECES_JOINTES_MAX, PieceJointeOffre, POIDS_MAX_PIECE } from '../../../core/services/models/stage.model';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { chargerImagePourRecadrage } from '../../../shared/images/charger-image';
import { FORMAT_OFFRE_STAGE } from '../../../shared/images/recadrage';
import { RecadreurImage } from '../../../shared/images/recadreur-image';
import { enregistrerFichier } from '../../../shared/telecharger';
import { TaillePipe } from '../taille-fichier';

/**
 * Pièces jointes d’une offre, téléchargeables par qui la voit. Quand l’offre est modifiable (son organisme ou
 * l’administrateur Stages), on y ajoute ou retire des PDF et on change ou retire l’image.
 */
@Component({
  selector: 'app-fichiers-offre',
  imports: [RecadreurImage, TaillePipe],
  templateUrl: './fichiers-offre.html',
  styleUrl: './fichiers-offre.scss',
})
export class FichiersOffre implements OnDestroy {
  private readonly service = inject(OffresStageService);
  private readonly document = inject(DOCUMENT);

  readonly offre = input.required<OffreStage>();
  /** L’offre après un changement de fichier, pour que la page se mette à jour. */
  readonly modifiee = output<OffreStage>();

  protected readonly formatImage = FORMAT_OFFRE_STAGE;
  protected readonly piecesMax = PIECES_JOINTES_MAX;
  protected readonly imageARecadrer = signal<HTMLImageElement | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly message = signal<string | null>(null);

  ngOnDestroy(): void {
    this.fermerRecadrage();
  }

  protected telecharger(piece: PieceJointeOffre): void {
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
    if (fichier.size > POIDS_MAX_PIECE) {
      this.erreur.set('Le fichier ne doit pas dépasser 5 Mo.');
      return;
    }
    this.executer(this.service.ajouterPiece(this.offre().id, fichier), `« ${fichier.name} » est jointe à l’offre.`);
  }

  protected retirerPiece(piece: PieceJointeOffre): void {
    this.executer(this.service.supprimerPiece(this.offre().id, piece.id), `« ${piece.nom} » est retirée de l’offre.`);
  }

  protected async choisirImage(evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) return;
    this.erreur.set(null);
    try {
      this.fermerRecadrage();
      this.imageARecadrer.set(await chargerImagePourRecadrage(fichier, FORMAT_OFFRE_STAGE));
    } catch (erreur) {
      this.erreur.set(erreur instanceof Error ? erreur.message : 'Cette image ne peut pas être utilisée.');
    }
  }

  protected envoyerImage(fichier: File): void {
    this.fermerRecadrage();
    this.executer(this.service.joindreImage(this.offre().id, fichier), 'L’image de l’offre est enregistrée.');
  }

  protected retirerImage(): void {
    this.executer(this.service.supprimerImage(this.offre().id), 'L’image de l’offre est retirée.');
  }

  protected fermerRecadrage(): void {
    const image = this.imageARecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.imageARecadrer.set(null);
  }

  private executer(requete: Observable<OffreStage>, message: string): void {
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
