import { DOCUMENT } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { DossierMobilite, LIBELLES_PIECE } from '../../../core/services/models/mobilite.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { enregistrerFichier } from '../../../shared/telecharger';

/** Pièces d’un dossier, téléchargeables par le chef du service mobilité ou, pour un retenu, par l’institut. */
@Component({
  selector: 'app-pieces-dossier',
  template: `
    <ul class="pieces">
      @for (piece of dossier().pieces; track piece.id) {
        <li><button type="button" (click)="telecharger(piece)"><i class="pi pi-file-pdf" aria-hidden="true"></i>{{ libelles[piece.type] }}</button></li>
      }
    </ul>
    @if (erreur(); as e) { <p class="erreur" role="alert">{{ e }}</p> }
  `,
  styles: `
    .pieces { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; margin: 0; padding: 0; list-style: none; }
    button { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0; border: 0; background: none; color: var(--ept-primary);
      font: inherit; font-size: 0.84rem; font-weight: 600; text-decoration: underline; cursor: pointer;
      &:focus-visible { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; } }
    .pi-file-pdf { color: var(--ept-error); }
    .erreur { margin: 0.3rem 0 0; color: var(--ept-error-dark); font-size: 0.82rem; font-weight: 600; }
  `,
})
export class PiecesDossier {
  private readonly service = inject(OffresMobiliteService);
  private readonly document = inject(DOCUMENT);

  readonly dossier = input.required<DossierMobilite>();
  protected readonly libelles = LIBELLES_PIECE;
  protected readonly erreur = signal<string | null>(null);

  protected telecharger(piece: DossierMobilite['pieces'][number]): void {
    this.erreur.set(null);
    this.service.telechargerPieceCandidature(this.dossier().id, piece.id).subscribe({
      next: (contenu) => enregistrerFichier(this.document, contenu, piece.nom),
      error: () => this.erreur.set(`« ${piece.nom} » n’a pas pu être téléchargé. Réessayez.`),
    });
  }
}
