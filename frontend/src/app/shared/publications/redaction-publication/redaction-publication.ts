import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, input, linkedSignal, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import {
  AudiencePublication, LIBELLES_TYPE_PUBLICATION, NouvellePublication, Publication, PublicationService, TypePublication,
} from '../../../core/services/publications/publication';
import { chargerImagePourRecadrage } from '../../images/charger-image';
import { estPetite, FORMAT_PUBLICATION } from '../../images/recadrage';
import { RecadreurImage } from '../../images/recadreur-image';

export const MESSAGES_SUCCES: Record<TypePublication, string> = {
  PUBLICATION: 'Votre publication a été publiée.',
  ANNONCE_OFFICIELLE: 'L’annonce officielle est publiée dans le fil.',
  APPEL_PROJET: 'L’appel à projet est diffusé dans le fil.',
};

const TITRES_FORMULAIRE: Record<TypePublication, string> = {
  PUBLICATION: 'Nouvelle publication',
  ANNONCE_OFFICIELLE: 'Nouvelle annonce officielle',
  APPEL_PROJET: 'Nouvel appel à projet',
};

/**
 * Rédaction d’une publication, avec image recadrée au format 4:5. Le fil propose le type « Publication » ;
 * l’administration y ajoute l’annonce officielle et l’appel à projet (titre et date limite obligatoires).
 */
@Component({
  selector: 'app-redaction-publication',
  imports: [RecadreurImage, FormField],
  templateUrl: './redaction-publication.html',
  styleUrl: './redaction-publication.scss',
})
export class RedactionPublication {
  /** Types proposés, le premier étant choisi par défaut. */
  readonly types = input<readonly TypePublication[]>(['PUBLICATION']);
  readonly libelleOuvrir = input('Partager une publication');
  /** Pendant le chargement de la page, la publication attend. */
  readonly desactivee = input(false);
  /**
   * Sur la page dédiée à la création : le formulaire est ouvert d’emblée, le curseur dans le message,
   * et « Annuler » émet `annulee` au lieu de replier le formulaire.
   */
  readonly integree = input(false);
  readonly publiee = output<Publication>();
  readonly annulee = output<void>();

  private readonly publicationService = inject(PublicationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialogueRecadrage = viewChild<ElementRef<HTMLDialogElement>>('dialogueRecadrage');
  private readonly champImage = viewChild<ElementRef<HTMLInputElement>>('champImage');
  private readonly boutonRepositionner = viewChild<ElementRef<HTMLButtonElement>>('boutonRepositionner');
  private readonly champContenu = viewChild<ElementRef<HTMLTextAreaElement>>('champContenu');
  protected readonly libellesTypes = LIBELLES_TYPE_PUBLICATION;
  protected readonly ouverte = linkedSignal(() => this.integree());
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
  protected readonly modele = signal(this.modeleVide());
  protected readonly titreObligatoire = computed(() => this.modele().type !== 'PUBLICATION');
  protected readonly titreFormulaire = computed(() => TITRES_FORMULAIRE[this.modele().type]);
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.titre, { when: () => this.titreObligatoire() });
    maxLength(champ.titre, 160);
    required(champ.contenu);
    maxLength(champ.contenu, 5000);
    maxLength(champ.texteAlternatif, 250);
    required(champ.dateLimite, { when: () => this.modele().type === 'APPEL_PROJET' });
  });
  private sequenceChargementImage = 0;

  constructor() {
    effect(() => {
      const dialogue = this.dialogueRecadrage()?.nativeElement;
      if (!dialogue) return;
      if (this.imageARecadrer() && !dialogue.open) dialogue.showModal();
      else if (!this.imageARecadrer() && dialogue.open) dialogue.close();
    });
    this.destroyRef.onDestroy(() => { this.retirerImage(); this.fermerRecadrage(); });
    afterNextRender(() => { if (this.integree()) this.champContenu()?.nativeElement.focus(); });
  }

  protected ouvrir(): void {
    this.modele.set(this.modeleVide());
    this.formulaire().reset();
    this.ouverte.set(true);
    this.messagePublication.set('');
  }

  protected choisirType(type: TypePublication): void {
    this.modele.update((valeurs) => ({ ...valeurs, type, dateLimite: type === 'APPEL_PROJET' ? valeurs.dateLimite : '' }));
    this.erreurPublication.set('');
  }

  protected async choisirImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.item(0) ?? null;
    input.value = '';
    if (!fichier) return;
    this.fermerRecadrage();
    this.erreurPublication.set('');
    this.avertissementImage.set('');
    await this.preparerRecadrage(fichier);
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
    this.erreurPublication.set('');
    await this.preparerRecadrage(fichier);
  }

  /** Charge l’image dans le recadreur ; une sélection plus récente annule celle en cours. */
  private async preparerRecadrage(fichier: File): Promise<void> {
    const sequence = ++this.sequenceChargementImage;
    this.chargementImage.set(true);
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

  private fermerRecadrage(): void {
    const image = this.imageARecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.imageARecadrer.set(null);
    this.fichierSourceRecadrage.set(undefined);
  }

  protected annulerRedaction(): void {
    if (this.integree()) {
      this.annulee.emit();
      return;
    }
    this.ouverte.set(false);
    this.erreurPublication.set('');
    this.avertissementImage.set('');
    this.retirerImage();
    this.fermerRecadrage();
    this.modele.set(this.modeleVide());
  }

  private retirerImage(): void {
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

  /** Le premier problème rencontré, dans l’ordre du formulaire ; vide si tout est prêt. */
  private probleme(): string {
    const valeurs = this.modele();
    if (this.chargementImage()) return 'Patientez pendant la préparation de l’image.';
    if (this.imageARecadrer()) return 'Validez ou annulez le recadrage de l’image avant de publier.';
    if (this.titreObligatoire() && !valeurs.titre.trim()) return 'Donnez un titre à cette publication.';
    if (this.formulaire.titre().invalid()) return 'Le titre ne doit pas dépasser 160 caractères.';
    if (valeurs.type === 'APPEL_PROJET') {
      if (!valeurs.dateLimite) return 'Indiquez la date limite de réponse.';
      if (valeurs.dateLimite < RedactionPublication.aujourdhui()) return 'La date limite de réponse est déjà passée.';
    }
    if (this.formulaire.texteAlternatif().invalid()) return 'Décrivez l’image en 250 caractères maximum.';
    if (this.formulaire.contenu().invalid() || !valeurs.contenu.trim()) return 'Ajoutez un texte de 5 000 caractères maximum.';
    return '';
  }

  protected publier(event: Event): void {
    event.preventDefault();
    if (this.envoiEnCours() || this.desactivee()) return;
    const probleme = this.probleme();
    if (probleme) {
      this.erreurPublication.set(probleme);
      return;
    }
    const valeurs = this.modele();
    const image = this.imageSelectionnee();
    const publication: NouvellePublication = {
      type: valeurs.type, titre: valeurs.titre.trim(), contenu: valeurs.contenu.trim(), audience: valeurs.audience,
      ...(image && valeurs.texteAlternatif.trim() ? { texteAlternatif: valeurs.texteAlternatif.trim() } : {}),
      ...(valeurs.type === 'APPEL_PROJET' ? { dateLimite: valeurs.dateLimite } : {}),
    };
    this.erreurPublication.set('');
    this.messagePublication.set('');
    this.envoiEnCours.set(true);
    this.publicationService.creer(publication, image)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (creee) => {
          this.publiee.emit(creee);
          this.retirerImage();
          this.modele.set(this.modeleVide());
          this.formulaire().reset();
          this.ouverte.set(this.integree());
          this.messagePublication.set(MESSAGES_SUCCES[creee.type]);
          this.envoiEnCours.set(false);
        },
        error: (erreur: HttpErrorResponse) => {
          const message = typeof erreur.error?.message === 'string' ? erreur.error.message : '';
          this.erreurPublication.set(erreur.status === 429
            ? 'Vous avez atteint la limite de publications pour les dernières 24 heures.'
            : erreur.status === 413 ? 'L’image dépasse 5 Mo.'
            : erreur.status === 400 && message ? message
            : erreur.status === 400 ? 'L’image ou les informations fournies ne sont pas valides. Vérifiez le format et la taille.'
            : erreur.status === 403 && message ? message
            : 'Impossible de publier pour le moment. Réessayez.');
          this.envoiEnCours.set(false);
        },
      });
  }

  private modeleVide() {
    return { type: this.types()[0] ?? ('PUBLICATION' as TypePublication), titre: '', contenu: '',
      audience: 'TOUS' as AudiencePublication, texteAlternatif: '', dateLimite: '' };
  }

  private static aujourdhui(): string {
    const maintenant = new Date();
    return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;
  }
}
