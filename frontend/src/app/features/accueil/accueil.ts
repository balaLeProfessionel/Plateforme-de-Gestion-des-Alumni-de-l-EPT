import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { EvenementService } from '../../core/services/evenements/evenement';
import { ProgrammeService } from '../../core/services/mentorat/programmes';
import { AUCUN_FILTRE, Evenement } from '../../core/services/models/evenement';
import { Programme } from '../../core/services/models/mentorat.model';
import { NouvellePublication, Publication, PublicationService } from '../../core/services/publications/publication';
import { AvatarMembre } from '../../shared/images/avatar-membre';
import { chargerImagePourRecadrage } from '../../shared/images/charger-image';
import { ImagePublication } from '../../shared/images/image-publication/image-publication';
import { estPetite, FORMAT_PUBLICATION } from '../../shared/images/recadrage';
import { RecadreurImage } from '../../shared/images/recadreur-image';
import { CommentairesPublication } from './commentaires-publication/commentaires-publication';

type CarteFil = { type: 'publication'; contenu: Publication }
  | { type: 'evenement'; contenu: Evenement } | { type: 'programme'; contenu: Programme };

@Component({ selector: 'app-accueil', imports: [DatePipe, RouterLink, AvatarMembre, ImagePublication, RecadreurImage, CommentairesPublication, FormField],
  templateUrl: './accueil.html', styleUrl: './accueil.scss' })
export class Accueil {
  private readonly publicationService = inject(PublicationService);
  private readonly evenementService = inject(EvenementService);
  private readonly programmeService = inject(ProgrammeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialogueRecadrage = viewChild<ElementRef<HTMLDialogElement>>('dialogueRecadrage');
  private readonly champImage = viewChild<ElementRef<HTMLInputElement>>('champImage');
  private readonly boutonRepositionner = viewChild<ElementRef<HTMLButtonElement>>('boutonRepositionner');
  protected readonly cartes = signal<CarteFil[]>([]);
  protected readonly chargement = signal(true);
  protected readonly erreurs = signal<string[]>([]);
  protected readonly redactionOuverte = signal(false);
  protected readonly envoiEnCours = signal(false);
  protected readonly messagePublication = signal('');
  protected readonly erreurPublication = signal('');
  protected readonly imageSelectionnee = signal<File | undefined>(undefined);
  protected readonly apercuImage = signal('');
  protected readonly imageARecadrer = signal<HTMLImageElement | null>(null);
  protected readonly fichierSourceRecadrage = signal<File | undefined>(undefined);
  protected readonly imageOriginale = signal<File | undefined>(undefined);
  protected readonly chargementImage = signal(false);
  protected readonly avertissementImage = signal('');
  protected readonly formatPublication = FORMAT_PUBLICATION;
  protected readonly modele = signal({ titre: '', contenu: '', audience: 'TOUS' as NouvellePublication['audience'], texteAlternatif: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.titre, 160);
    required(champ.contenu);
    maxLength(champ.contenu, 5000);
    maxLength(champ.texteAlternatif, 250);
  });
  private sequenceChargementImage = 0;
  constructor() {
    effect(() => {
      const dialogue = this.dialogueRecadrage()?.nativeElement;
      if (!dialogue) return;
      if (this.imageARecadrer() && !dialogue.open) dialogue.showModal();
      else if (!this.imageARecadrer() && dialogue.open) dialogue.close();
    });
    this.charger();
    this.destroyRef.onDestroy(() => { this.retirerImage(); this.fermerRecadrage(); });
  }

  protected async choisirImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.item(0) ?? null;
    input.value = '';
    if (!fichier) return;
    const sequence = ++this.sequenceChargementImage;
    this.fermerRecadrage();
    this.erreurPublication.set('');
    this.avertissementImage.set('');
    this.chargementImage.set(true);
    try {
      const image = await chargerImagePourRecadrage(fichier, FORMAT_PUBLICATION);
      if (sequence !== this.sequenceChargementImage) {
        URL.revokeObjectURL(image.src);
        return;
      }
      this.fichierSourceRecadrage.set(fichier);
      this.imageARecadrer.set(image);
      if (estPetite({ largeur: image.naturalWidth, hauteur: image.naturalHeight }, FORMAT_PUBLICATION)) {
        this.avertissementImage.set(`Image de petite taille (${image.naturalWidth} × ${image.naturalHeight} pixels) : le recadrage pourra paraître un peu flou.`);
      }
    } catch (erreur) {
      if (sequence === this.sequenceChargementImage) {
        this.erreurPublication.set(erreur instanceof Error ? erreur.message : 'Cette image ne peut pas être utilisée.');
      }
    } finally {
      if (sequence === this.sequenceChargementImage) this.chargementImage.set(false);
    }
  }

  protected appliquerRecadrage(fichier: File): void {
    const source = this.fichierSourceRecadrage();
    this.fermerRecadrage();
    this.imageOriginale.set(source);
    this.definirApercu(fichier);
    this.erreurPublication.set('');
    this.rendreFocus();
  }

  protected async repositionnerImage(): Promise<void> {
    const fichier = this.imageOriginale();
    if (!fichier || this.imageARecadrer() || this.chargementImage()) return;
    const sequence = ++this.sequenceChargementImage;
    this.chargementImage.set(true);
    this.erreurPublication.set('');
    try {
      const image = await chargerImagePourRecadrage(fichier, FORMAT_PUBLICATION);
      if (sequence !== this.sequenceChargementImage) {
        URL.revokeObjectURL(image.src);
        return;
      }
      this.fichierSourceRecadrage.set(fichier);
      this.imageARecadrer.set(image);
      this.avertissementImage.set(estPetite({ largeur: image.naturalWidth, hauteur: image.naturalHeight }, FORMAT_PUBLICATION)
        ? `Image de petite taille (${image.naturalWidth} × ${image.naturalHeight} pixels) : le recadrage pourra paraître un peu flou.`
        : '');
    } catch (erreur) {
      if (sequence === this.sequenceChargementImage) {
        this.erreurPublication.set(erreur instanceof Error ? erreur.message : 'Cette image ne peut pas être utilisée.');
      }
    } finally {
      if (sequence === this.sequenceChargementImage) this.chargementImage.set(false);
    }
  }

  protected annulerRecadrage(): void {
    this.fermerRecadrage();
    this.avertissementImage.set('');
    this.rendreFocus();
  }

  protected retirerImageChoisie(): void {
    this.retirerImage();
    this.modele.update((valeurs) => ({ ...valeurs, texteAlternatif: '' }));
    this.rendreFocus();
  }

  /**
   * À la fermeture du recadrage ou au retrait de l’image, le focus revient là où l’utilisateur poursuit :
   * l’aperçu s’il y a une image, sinon le choix de fichier — jamais en haut de la page.
   */
  private rendreFocus(): void {
    afterNextRender(() => (this.boutonRepositionner() ?? this.champImage())?.nativeElement.focus(),
      { injector: this.injector });
  }

  protected fermerRecadrage(): void {
    const image = this.imageARecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.imageARecadrer.set(null);
    this.fichierSourceRecadrage.set(undefined);
  }

  protected annulerRedaction(): void {
    this.sequenceChargementImage++;
    this.chargementImage.set(false);
    this.redactionOuverte.set(false);
    this.erreurPublication.set('');
    this.avertissementImage.set('');
    this.retirerImage();
    this.modele.update((valeurs) => ({ ...valeurs, texteAlternatif: '' }));
    this.fermerRecadrage();
  }

  protected retirerImage(): void {
    this.sequenceChargementImage++;
    this.chargementImage.set(false);
    this.libererApercu();
    this.imageSelectionnee.set(undefined);
    this.imageOriginale.set(undefined);
  }

  private definirApercu(fichier: File): void {
    this.libererApercu();
    this.imageSelectionnee.set(fichier);
    this.apercuImage.set(URL.createObjectURL(fichier));
  }

  private libererApercu(): void {
    const apercu = this.apercuImage();
    if (apercu) URL.revokeObjectURL(apercu);
    this.apercuImage.set('');
  }

  protected publier(event: Event): void {
    event.preventDefault();
    if (this.envoiEnCours() || this.chargement()) return;
    if (this.chargementImage()) {
      this.erreurPublication.set('Patientez pendant la préparation de l’image.');
      return;
    }
    if (this.imageARecadrer()) {
      this.erreurPublication.set('Validez ou annulez le recadrage de l’image avant de publier.');
      return;
    }
    const valeurs = this.modele();
    if (this.formulaire.texteAlternatif().invalid()) {
      this.erreurPublication.set('Décrivez l’image en 250 caractères maximum.');
      return;
    }
    if (this.formulaire().invalid() || !valeurs.contenu.trim()) {
      this.erreurPublication.set('Ajoutez un texte de 5 000 caractères maximum.');
      return;
    }
    this.erreurPublication.set('');
    this.messagePublication.set('');
    this.envoiEnCours.set(true);
    const image = this.imageSelectionnee();
    this.publicationService.creer({ type: 'PUBLICATION', titre: valeurs.titre.trim(), contenu: valeurs.contenu.trim(),
      audience: valeurs.audience, ...(image && valeurs.texteAlternatif.trim() ? { texteAlternatif: valeurs.texteAlternatif.trim() } : {}) },
      image)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (publication) => {
          this.cartes.update((cartes) => [{ type: 'publication', contenu: publication }, ...cartes]);
          this.modele.set({ titre: '', contenu: '', audience: 'TOUS', texteAlternatif: '' });
          this.retirerImage();
          this.redactionOuverte.set(false);
          this.messagePublication.set('Votre publication a été publiée.');
          this.envoiEnCours.set(false);
        },
        error: (erreur: HttpErrorResponse) => {
          this.erreurPublication.set(erreur.status === 400 || erreur.status === 413
            ? 'L’image ou les informations fournies ne sont pas valides. Vérifiez le format et la taille.' : erreur.status === 429
            ? 'Vous avez atteint la limite de publications pour les dernières 24 heures.'
            : 'Impossible de publier pour le moment. Réessayez.');
          this.envoiEnCours.set(false);
        },
      });
  }

  protected charger(): void {
    this.chargement.set(true);
    this.erreurs.set([]);
    forkJoin({
      publications: this.publicationService.lister().pipe(
        map((page) => ({ valeur: page.contenu, erreur: false })),
        catchError(() => of({ valeur: [] as Publication[], erreur: true }))),
      evenements: this.evenementService.lister('AVENIR', 0, AUCUN_FILTRE, 3).pipe(
        map((page) => ({ valeur: page.contenu, erreur: false })),
        catchError(() => of({ valeur: [] as Evenement[], erreur: true }))),
      programmes: this.programmeService.listerOuverts().pipe(
        map((programmes) => ({ valeur: programmes.slice(0, 3), erreur: false })),
        catchError(() => of({ valeur: [] as Programme[], erreur: true }))),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(({ publications, evenements, programmes }) => {
      const cartes: CarteFil[] = [];
      const taille = Math.max(publications.valeur.length, evenements.valeur.length, programmes.valeur.length);
      for (let i = 0; i < taille; i++) {
        if (publications.valeur[i]) cartes.push({ type: 'publication', contenu: publications.valeur[i] });
        if (evenements.valeur[i]) cartes.push({ type: 'evenement', contenu: evenements.valeur[i] });
        if (programmes.valeur[i]) cartes.push({ type: 'programme', contenu: programmes.valeur[i] });
      }
      this.cartes.set(cartes);
      this.erreurs.set([
        ...(publications.erreur ? ['publications'] : []), ...(evenements.erreur ? ['événements'] : []),
        ...(programmes.erreur ? ['programmes de mentorat'] : []),
      ]);
      this.chargement.set(false);
    });
  }
}
