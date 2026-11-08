import { Component, input, OnDestroy, output, signal } from '@angular/core';
import { chargerImagePourRecadrage } from '../../../shared/images/charger-image';
import { ImagePublication } from '../../../shared/images/image-publication/image-publication';
import { FORMAT_EVENEMENT } from '../../../shared/images/recadrage';
import { RecadreurImage } from '../../../shared/images/recadreur-image';

/** Couverture facultative d’un article : l’image choisie est recadrée au format 16:9 avant d’être retenue. */
@Component({
  selector: 'app-couverture-article',
  imports: [ImagePublication, RecadreurImage],
  template: `
    @if (imageARecadrer(); as image) {
      <app-recadreur-image [image]="image" [format]="format" libelle="Recadrer la couverture au format 16:9"
        (recadree)="appliquer($event)" (annulee)="fermerRecadrage()" />
    } @else if (apercu(); as url) {
      <div class="apercu"><app-image-publication [url]="url" description="Couverture de l’article" /></div>
      <div class="actions">
        <button type="button" (click)="champ.click()"><i class="pi pi-image" aria-hidden="true"></i> Changer</button>
        <button type="button" (click)="retiree.emit()"><i class="pi pi-times" aria-hidden="true"></i> Retirer la couverture</button>
      </div>
    } @else {
      <button type="button" class="choisir" (click)="champ.click()" aria-describedby="aide-couverture">
        <i class="pi pi-image" aria-hidden="true"></i> Ajouter une couverture
      </button>
    }
    <small id="aide-couverture" class="cache">Facultatif. Format 16:9, JPEG ou PNG de 5 Mo au plus.</small>
    @if (erreur(); as message) { <p class="erreur" role="alert">{{ message }}</p> }
    <input #champ class="fichier-cache" type="file" accept="image/jpeg,image/png" tabindex="-1" aria-hidden="true"
      (change)="selectionner($event)" />
  `,
  styles: `
    :host { display: grid; gap: .5rem; }
    .apercu { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: var(--ept-radius-sm); }
    .choisir { display: inline-flex; align-items: center; justify-self: start; gap: .5rem; min-height: 2.5rem; padding: .25rem .1rem;
      border: 0; background: transparent; color: var(--ept-text-secondary); font: inherit; font-size: .92rem; cursor: pointer; }
    .choisir:hover { color: var(--ept-primary); }
    .choisir .pi { font-size: 1.05rem; }
    .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
    .actions button { display: inline-flex; align-items: center; gap: .35rem; min-height: 2.25rem; padding: .3rem .75rem;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius-sm); background: var(--ept-surface);
      color: var(--ept-primary); font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .erreur { margin: 0; color: var(--ept-error-dark); font-size: .88rem; }
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
