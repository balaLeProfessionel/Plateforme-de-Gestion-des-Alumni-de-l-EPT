import { Component, input, OnDestroy, output, signal } from '@angular/core';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { Message } from 'primeng/message';
import { chargerImagePourRecadrage } from '../../../shared/images/charger-image';
import { ImagePublication } from '../../../shared/images/image-publication/image-publication';
import { FORMAT_EVENEMENT } from '../../../shared/images/recadrage';
import { RecadreurImage } from '../../../shared/images/recadreur-image';

/** Couverture facultative d’un article : l’image choisie est recadrée au format 16:9 avant d’être retenue. */
@Component({
  selector: 'app-couverture-article',
  imports: [ButtonDirective, ButtonIcon, ButtonLabel, Message, ImagePublication, RecadreurImage],
  template: `
    @if (imageARecadrer(); as image) {
      <app-recadreur-image [image]="image" [format]="format" libelle="Recadrer la couverture au format 16:9"
        (recadree)="appliquer($event)" (annulee)="fermerRecadrage()" />
    } @else if (apercu(); as url) {
      <div class="apercu"><app-image-publication [url]="url" description="Couverture de l’article" /></div>
      <div class="actions">
        <button pButton type="button" outlined size="small" (click)="champ.click()">
          <i pButtonIcon class="pi pi-image" aria-hidden="true"></i><span pButtonLabel>Changer</span></button>
        <button pButton type="button" outlined size="small" severity="secondary" (click)="retiree.emit()">
          <i pButtonIcon class="pi pi-times" aria-hidden="true"></i><span pButtonLabel>Retirer la couverture</span></button>
      </div>
    } @else {
      <button pButton type="button" class="choisir" text severity="secondary" (click)="champ.click()" aria-describedby="aide-couverture">
        <i pButtonIcon class="pi pi-image" aria-hidden="true"></i><span pButtonLabel>Ajouter une couverture</span>
      </button>
    }
    <small id="aide-couverture" class="cache">Facultatif. Format 16:9, JPEG ou PNG de 5 Mo au plus.</small>
    @if (erreur(); as message) { <p-message severity="error" size="small">{{ message }}</p-message> }
    <input #champ class="fichier-cache" type="file" accept="image/jpeg,image/png" tabindex="-1" aria-hidden="true"
      (change)="selectionner($event)" />
  `,
  styles: `
    :host { display: grid; gap: .5rem; }
    .apercu { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: var(--ept-radius-sm); }
    .choisir { justify-self: start; min-height: 2.5rem; margin-left: -.75rem; }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    .actions button { min-height: 2.25rem; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .fichier-cache { display: none; }
    button:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
  `,
})
export class CouvertureArticle implements OnDestroy {
  /** Image affichée : couverture enregistrée (URL de l’API) ou image fraîchement recadrée (URL locale). */
  readonly apercu = input<string | null>(null);
  readonly choisie = output<File>();
  readonly retiree = output<void>();

  protected readonly format = FORMAT_EVENEMENT;
  protected readonly imageARecadrer = signal<HTMLImageElement | null>(null);
  protected readonly erreur = signal<string | null>(null);

  protected async selectionner(event: Event): Promise<void> {
    const champ = event.target as HTMLInputElement;
    const fichier = champ.files?.item(0) ?? null;
    champ.value = '';
    this.erreur.set(null);
    if (!fichier) return;
    try {
      this.fermerRecadrage();
      this.imageARecadrer.set(await chargerImagePourRecadrage(fichier, FORMAT_EVENEMENT));
    } catch (erreur) {
      this.erreur.set(erreur instanceof Error ? erreur.message : 'Cette image ne peut pas être utilisée.');
    }
  }

  protected appliquer(fichier: File): void {
    this.fermerRecadrage();
    this.choisie.emit(fichier);
  }

  protected fermerRecadrage(): void {
    const image = this.imageARecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.imageARecadrer.set(null);
  }

  ngOnDestroy(): void {
    this.fermerRecadrage();
  }
}
