import { DOCUMENT } from '@angular/common';
import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { PieceJointe } from '../../../core/services/models/messagerie.model';
import { formaterTaille } from './pieces-jointes';

/**
 * Fichier joint dans une bulle. Il n’a pas d’adresse publique : on le demande avec le jeton, puis on
 * l’affiche (image) ou on le propose au téléchargement (autres fichiers) par une adresse locale `blob:`.
 */
@Component({
  selector: 'app-piece-jointe-message',
  template: `
    @let piece = pieceJointe();
    @if (piece.image) {
      @if (adresse(); as url) {
        <a class="apercu" [href]="url" target="_blank" rel="noopener" [attr.aria-label]="'Ouvrir l’image ' + piece.nom">
          <img [src]="url" [alt]="'Image jointe : ' + piece.nom" />
        </a>
      } @else if (!erreur()) {
        <span class="attente" role="status">Chargement de l’image…</span>
      }
    } @else {
      <button type="button" class="fichier" [disabled]="enCours()" (click)="telecharger()"
        [attr.aria-label]="'Télécharger ' + piece.nom + ', ' + taille()">
        <i class="pi pi-file" aria-hidden="true"></i>
        <span class="nom">{{ piece.nom }}</span>
        <span class="taille">{{ taille() }}</span>
        <i class="pi pi-download" aria-hidden="true"></i>
      </button>
    }
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
  `,
  styleUrl: './piece-jointe-message.scss',
  host: { '[class.sur-sombre]': 'surFondSombre()' },
})
export class PieceJointeMessage implements OnInit {
  private readonly messagerie = inject(MessagerieService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  readonly conversationId = input.required<string>();
  readonly messageId = input.required<string>();
  readonly pieceJointe = input.required<PieceJointe>();
  /** Vrai dans mes bulles (fond marine). */
  readonly surFondSombre = input(false);

  protected readonly adresse = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly taille = computed(() => formaterTaille(this.pieceJointe().taille));

  ngOnInit(): void {
    if (this.pieceJointe().image) this.charger((url) => this.adresse.set(url), 'L’image n’a pas pu être chargée.');
  }

  protected telecharger(): void {
    this.charger((url) => {
      const lien = this.document.createElement('a');
      lien.href = url;
      lien.download = this.pieceJointe().nom;
      lien.click();
    }, 'Le fichier n’a pas pu être téléchargé. Réessayez.');
  }

  private charger(utiliser: (url: string) => void, messageErreur: string): void {
    const urls = this.document.defaultView?.URL;
    if (!urls?.createObjectURL) return;
    this.enCours.set(true);
    this.erreur.set(null);
    const abonnement = this.messagerie.telechargerPieceJointe(this.conversationId(), this.messageId()).subscribe({
      next: (contenu) => {
        this.enCours.set(false);
        const url = urls.createObjectURL(contenu);
        // L’adresse locale vit tant que la bulle est affichée.
        this.destroyRef.onDestroy(() => urls.revokeObjectURL(url));
        utiliser(url);
      },
      error: () => {
        this.enCours.set(false);
        this.erreur.set(messageErreur);
      },
    });
    this.destroyRef.onDestroy(() => abonnement.unsubscribe());
  }
}
