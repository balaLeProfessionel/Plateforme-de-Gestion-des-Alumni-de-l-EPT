import { DOCUMENT } from '@angular/common';
import {
  afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, input, OnInit, signal,
} from '@angular/core';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { PieceJointe } from '../../../core/services/models/messagerie.model';
import { formaterTaille } from './pieces-jointes';
import { VisionneuseImage } from './visionneuse-image';

/**
 * Fichier joint dans une bulle. Il n’a pas d’adresse publique : on le demande avec le jeton, puis on
 * l’affiche (image) ou on le propose au téléchargement (autres fichiers) par une adresse locale `blob:`.
 * Un clic sur une photo l’ouvre en grand dans la visionneuse.
 */
@Component({
  selector: 'app-piece-jointe-message',
  imports: [VisionneuseImage],
  template: `
    @let piece = pieceJointe();
    @if (piece.image) {
      @if (adresse(); as url) {
        <button type="button" class="apercu" aria-haspopup="dialog" [attr.aria-label]="'Agrandir l’image ' + piece.nom"
          (click)="visionneuse.set(true)">
          <img [src]="url" [alt]="'Image jointe : ' + piece.nom" />
        </button>
        @if (visionneuse()) {
          <app-visionneuse-image [url]="url" [nom]="piece.nom" (fermee)="fermerVisionneuse()" />
        }
      } @else if (!erreur()) {
        <span class="attente" role="status">Chargement de l’image…</span>
      }
    } @else {
      <button type="button" class="fichier" [disabled]="enCours()" (click)="telecharger()"
        [attr.aria-label]="'Télécharger ' + piece.nom + ', ' + taille()">
        <!-- Carte de fichier : pastille du type (couleur selon la famille), nom, « PDF · 611 o », téléchargement. -->
        <span class="type" [class]="famille()" aria-hidden="true">{{ extension() }}</span>
        <span class="infos">
          <span class="nom">{{ piece.nom }}</span>
          <span class="taille">{{ extension() }} · {{ taille() }}</span>
        </span>
        <i class="pi pi-download telecharger" aria-hidden="true"></i>
      </button>
    }
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
  `,
  styleUrl: './piece-jointe-message.scss',
})
export class PieceJointeMessage implements OnInit {
  private readonly messagerie = inject(MessagerieService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  readonly conversationId = input.required<string>();
  readonly messageId = input.required<string>();
  readonly pieceJointe = input.required<PieceJointe>();

  protected readonly adresse = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly taille = computed(() => formaterTaille(this.pieceJointe().taille));
  /** « PDF », « DOCX »… : l’extension du nom, en capitales (« FICHIER » s’il n’y en a pas). */
  protected readonly extension = computed(() => {
    const nom = this.pieceJointe().nom;
    const point = nom.lastIndexOf('.');
    return point > 0 && point < nom.length - 1 ? nom.slice(point + 1, point + 5).toUpperCase() : 'FICHIER';
  });
  /** Famille du fichier, pour la couleur de sa pastille. */
  protected readonly famille = computed(() => {
    const extension = this.extension();
    if (extension === 'PDF') return 'pdf';
    if (['DOC', 'DOCX', 'ODT', 'TXT', 'RTF'].includes(extension)) return 'texte';
    if (['XLS', 'XLSX', 'ODS', 'CSV'].includes(extension)) return 'tableur';
    if (['PPT', 'PPTX', 'ODP'].includes(extension)) return 'presentation';
    return 'autre';
  });
  /** La photo est ouverte en grand (visionneuse plein écran). */
  protected readonly visionneuse = signal(false);

  /** La visionneuse se ferme : le focus revient sur la miniature qui l’avait ouverte. */
  protected fermerVisionneuse(): void {
    this.visionneuse.set(false);
    afterNextRender(() => this.hote.nativeElement.querySelector<HTMLElement>('.apercu')?.focus(), { injector: this.injector });
  }

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
