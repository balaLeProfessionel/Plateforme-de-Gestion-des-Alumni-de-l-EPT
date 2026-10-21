import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { DecimalPipe, DOCUMENT } from '@angular/common';
import {
  contraindre,
  deplacer,
  Dimensions,
  etatInitial,
  EtatRecadrage,
  FormatRecadrage,
  styleApercu,
  zoneSource,
  zoomMaximal,
} from './recadrage';

const PAS_CLAVIER = 0.05;
const PAS_ZOOM = 0.1;

/**
 * Recadrage au format imposé : l'image se déplace sous un cadre fixe (souris, doigt ou flèches du
 * clavier) et se zoome (curseur, + et −). Le résultat est produit à la taille exacte du format.
 */
@Component({
  selector: 'app-recadreur-image',
  imports: [DecimalPipe],
  templateUrl: './recadreur-image.html',
  styleUrl: './recadreur-image.scss',
})
export class RecadreurImage {
  private readonly document = inject(DOCUMENT);
  private readonly cadre = viewChild<ElementRef<HTMLElement>>('cadre');

  /** Image choisie par le membre, déjà vérifiée (type, poids, dimensions minimales). */
  readonly image = input.required<HTMLImageElement>();
  readonly format = input.required<FormatRecadrage>();
  /** Aperçu rond (photo de profil) : le fichier produit reste carré. */
  readonly rond = input(false);
  readonly libelle = input('Recadrer l’image');
  readonly recadree = output<File>();
  readonly annulee = output<void>();

  protected readonly dimensions = computed<Dimensions>(() => ({
    largeur: this.image().naturalWidth,
    hauteur: this.image().naturalHeight,
  }));
  protected readonly etat = signal<EtatRecadrage>({ centreX: 0, centreY: 0, zoom: 1 });
  protected readonly zoomMax = computed(() => zoomMaximal(this.dimensions(), this.format()));
  protected readonly apercu = computed(() => styleApercu(this.etat(), this.dimensions(), this.format()));
  protected readonly rapport = computed(() => `${this.format().largeur} / ${this.format().hauteur}`);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private glissement: { x: number; y: number; pointeur: number } | null = null;

  constructor() {
    effect(() => this.etat.set(etatInitial(this.dimensions())));
  }

  protected commencerGlissement(evenement: PointerEvent): void {
    this.glissement = { x: evenement.clientX, y: evenement.clientY, pointeur: evenement.pointerId };
    (evenement.currentTarget as HTMLElement).setPointerCapture?.(evenement.pointerId);
  }

  protected glisser(evenement: PointerEvent): void {
    const glissement = this.glissement;
    if (!glissement || glissement.pointeur !== evenement.pointerId) return;
    const largeur = this.cadre()?.nativeElement.getBoundingClientRect().width || 1;
    this.etat.update((etat) => deplacer(etat, evenement.clientX - glissement.x,
      evenement.clientY - glissement.y, largeur, this.dimensions(), this.format()));
    this.glissement = { ...glissement, x: evenement.clientX, y: evenement.clientY };
  }

  protected finirGlissement(): void {
    this.glissement = null;
  }

  protected zoomer(evenement: Event): void {
    this.changerZoom(Number((evenement.target as HTMLInputElement).value));
  }

  protected zoomerALaMolette(evenement: WheelEvent): void {
    evenement.preventDefault();
    this.changerZoom(this.etat().zoom - Math.sign(evenement.deltaY) * PAS_ZOOM);
  }

  /** Flèches : déplacent de 5 % du cadre ; + et − : zoom ; 0 : recentrer. */
  protected clavier(evenement: KeyboardEvent): void {
    const zone = zoneSource(this.etat(), this.dimensions(), this.format());
    const deplacements: Record<string, [number, number]> = {
      ArrowLeft: [-zone.largeur * PAS_CLAVIER, 0],
      ArrowRight: [zone.largeur * PAS_CLAVIER, 0],
      ArrowUp: [0, -zone.hauteur * PAS_CLAVIER],
      ArrowDown: [0, zone.hauteur * PAS_CLAVIER],
    };
    const deplacement = deplacements[evenement.key];
    if (deplacement) {
      this.etat.update((etat) => contraindre(
        { ...etat, centreX: etat.centreX + deplacement[0], centreY: etat.centreY + deplacement[1] },
        this.dimensions(), this.format()));
    } else if (evenement.key === '+' || evenement.key === '=') {
      this.changerZoom(this.etat().zoom + PAS_ZOOM);
    } else if (evenement.key === '-') {
      this.changerZoom(this.etat().zoom - PAS_ZOOM);
    } else if (evenement.key === '0') {
      this.recentrer();
    } else {
      return;
    }
    evenement.preventDefault();
  }

  protected recentrer(): void {
    this.etat.set(etatInitial(this.dimensions()));
  }

  protected async valider(): Promise<void> {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      this.recadree.emit(await this.produireFichier());
    } catch {
      this.erreur.set('Le recadrage a échoué. Essayez une autre image.');
    } finally {
      this.enCours.set(false);
    }
  }

  private changerZoom(zoom: number): void {
    this.etat.update((etat) => contraindre({ ...etat, zoom }, this.dimensions(), this.format()));
  }

  /** Dessine la zone choisie à la taille exacte du format, en JPEG (comme le stockage serveur). */
  private produireFichier(): Promise<File> {
    const { largeur, hauteur } = this.format();
    const toile = this.document.createElement('canvas');
    toile.width = largeur;
    toile.height = hauteur;
    const contexte = toile.getContext('2d');
    if (!contexte) return Promise.reject(new Error('Canvas indisponible'));
    const zone = zoneSource(this.etat(), this.dimensions(), this.format());
    contexte.fillStyle = '#ffffff';
    contexte.fillRect(0, 0, largeur, hauteur);
    contexte.imageSmoothingQuality = 'high';
    contexte.drawImage(this.image(), zone.x, zone.y, zone.largeur, zone.hauteur, 0, 0, largeur, hauteur);
    return new Promise((resoudre, rejeter) => toile.toBlob((blob) => blob
      ? resoudre(new File([blob], 'image-recadree.jpg', { type: 'image/jpeg' }))
      : rejeter(new Error('Encodage impossible')), 'image/jpeg', 0.9));
  }
}
