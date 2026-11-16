import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { ConversationDetail } from '../../../core/services/models/messagerie.model';
import { chargerImagePourRecadrage } from '../../../shared/images/charger-image';
import { FORMAT_PHOTO_PROFIL } from '../../../shared/images/recadrage';
import { RecadreurImage } from '../../../shared/images/recadreur-image';
import { AvatarGroupe } from '../avatar-groupe';

/**
 * Photo du groupe : affichée pour tous, changée ou retirée par un administrateur. Elle passe par le même
 * recadrage carré qu’une photo de profil ; l’image recadrée est envoyée aussitôt.
 */
@Component({
  selector: 'app-photo-groupe',
  imports: [AvatarGroupe, RecadreurImage],
  template: `
    @if (aRecadrer(); as image) {
      <app-recadreur-image [image]="image" [format]="format" [rond]="true" libelle="Recadrer la photo du groupe"
        (recadree)="envoyer($event)" (annulee)="fermerRecadrage()" />
    } @else {
      <div class="photo">
        <app-avatar-groupe [urlPhoto]="detail().urlPhoto" [taille]="4.5"
          [libelle]="detail().urlPhoto ? 'Photo du groupe ' + detail().nom : null" />
        @if (administrateur()) {
          <div class="actions">
            <label class="bouton secondaire" [class.inactif]="enCours()" for="photo-groupe">
              {{ detail().urlPhoto ? 'Changer la photo' : 'Ajouter une photo' }}
            </label>
            <input id="photo-groupe" class="fichier-cache" type="file" accept="image/jpeg,image/png"
              [disabled]="enCours()" (change)="choisir($event)" />
            @if (detail().urlPhoto) {
              <button type="button" class="bouton lien-danger" [disabled]="enCours()" (click)="retirer()">Retirer</button>
            }
          </div>
        }
      </div>
      @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
    }
  `,
  styles: `
    :host { display: grid; gap: 0.5rem; }
    .photo { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .bouton {
      display: inline-flex;
      min-height: 2.5rem;
      align-items: center;
      padding: 0 0.85rem;
      border-radius: var(--ept-radius-sm);
      font: inherit;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .secondaire { border: 1px solid var(--ept-border); background: white; color: var(--ept-primary); }
    .secondaire:hover { background: var(--ept-primary-light); }
    .lien-danger { border: 0; background: transparent; color: var(--ept-error-dark); }
    .lien-danger:hover { background: var(--ept-error-light); }
    .inactif { opacity: 0.6; pointer-events: none; }
    .fichier-cache { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); opacity: 0; }
    .fichier-cache:focus-visible + .bouton, .bouton:focus-visible { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; }
    label.bouton:has(+ .fichier-cache:focus-visible) { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; }
    .erreur { margin: 0; color: var(--ept-error-dark); font-size: 0.85rem; }
  `,
})
export class PhotoGroupe {
  private readonly messagerie = inject(MessagerieService);
  readonly detail = input.required<ConversationDetail>();
  readonly administrateur = input(false);
  readonly modifie = output<ConversationDetail>();

  protected readonly format = FORMAT_PHOTO_PROFIL;
  protected readonly aRecadrer = signal<HTMLImageElement | null>(null);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected async choisir(evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0] ?? null;
    champ.value = '';
    this.erreur.set(null);
    if (!fichier) return;
    try {
      this.aRecadrer.set(await chargerImagePourRecadrage(fichier, FORMAT_PHOTO_PROFIL));
    } catch (erreur) {
      this.erreur.set(erreur instanceof Error ? erreur.message : 'Cette photo ne peut pas être utilisée.');
    }
  }

  protected fermerRecadrage(): void {
    const image = this.aRecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.aRecadrer.set(null);
  }

  protected envoyer(photo: File): Promise<void> {
    this.fermerRecadrage();
    return this.executer(this.messagerie.changerPhotoGroupe(this.detail().id, photo));
  }

  protected retirer(): Promise<void> {
    return this.executer(this.messagerie.retirerPhotoGroupe(this.detail().id));
  }

  private async executer(requete: Observable<ConversationDetail>): Promise<void> {
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      this.modifie.emit(await firstValueFrom(requete));
    } catch (erreur) {
      this.erreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message : 'La photo n’a pas pu être enregistrée. Réessayez.');
    } finally {
      this.enCours.set(false);
    }
  }
}
