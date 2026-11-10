import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, OnDestroy, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form, max, maxLength, min, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, map, of, switchMap } from 'rxjs';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import {
  LIBELLES_TYPE_STAGE, OffreStage, OffreStageRequete, PIECES_JOINTES_MAX, POIDS_MAX_PIECE, TYPES_STAGE, TypeStage,
} from '../../../core/services/models/stage.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { OffresStageService } from '../../../core/services/stages/offres-stage';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { chargerImagePourRecadrage } from '../../../shared/images/charger-image';
import { estPetite, FORMAT_OFFRE_STAGE } from '../../../shared/images/recadrage';
import { RecadreurImage } from '../../../shared/images/recadreur-image';
import { TaillePipe } from '../taille-fichier';

const VIERGE = {
  organisme: '', titre: '', typeStage: '' as TypeStage | '', dureeMois: '', lieu: '', dateDebutPrevue: '', nombrePlaces: '',
  dateLimiteCandidature: '', description: '', competences: '',
};

/** Date du jour au format des champs date (fuseau du navigateur). */
function aujourdhui(): string {
  const maintenant = new Date();
  return new Date(maintenant.getTime() - maintenant.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function entier(valeur: string): number | null {
  const nombre = Number(valeur.trim());
  return valeur.trim() && Number.isInteger(nombre) ? nombre : null;
}

/**
 * Publication d’une offre de stage (STA-01). L’organisme publie pour lui-même : directement s’il est validé par
 * l’école, sinon après vérification. L’administrateur Stages (route data `administration`) saisit l’offre au nom
 * d’un organisme existant ou nouveau, et elle est publiée directement.
 */
@Component({
  selector: 'app-formulaire-offre',
  imports: [FormField, RouterLink, BoutonRetour, RecadreurImage, TaillePipe],
  templateUrl: './formulaire-offre.html',
  styleUrl: './formulaire-offre.scss',
})
export class FormulaireOffre implements OnDestroy {
  private readonly service = inject(OffresStageService);
  private readonly organismeService = inject(OrganismeService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly administration = inject(ActivatedRoute).snapshot.data['administration'] === true;
  protected readonly secours = this.administration ? '/admin/stages/offres' : '/stages/mes-offres';
  protected readonly types = TYPES_STAGE;
  protected readonly libellesType = LIBELLES_TYPE_STAGE;

  protected readonly modele = signal({ ...VIERGE });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.organisme, { message: 'Indiquez l’organisme.', when: () => this.administration });
    maxLength(champ.organisme, 150, { message: '150 caractères au maximum.' });
    required(champ.titre, { message: 'Le titre est obligatoire.' });
    maxLength(champ.titre, 150, { message: '150 caractères au maximum.' });
    required(champ.typeStage, { message: 'Choisissez le type de stage.' });
    required(champ.dureeMois, { message: 'La durée est obligatoire.' });
    validate(champ.dureeMois, ({ value }) => {
      const duree = entier(value());
      return value().trim() && (duree === null || duree < 1 || duree > 24)
        ? { kind: 'duree', message: 'Indiquez un nombre de mois entre 1 et 24.' } : undefined;
    });
    maxLength(champ.lieu, 150, { message: '150 caractères au maximum.' });
    validate(champ.nombrePlaces, ({ value }) => {
      const places = entier(value());
      return value().trim() && (places === null || places < 1 || places > 100)
        ? { kind: 'places', message: 'Indiquez un nombre entre 1 et 100.' } : undefined;
    });
    required(champ.dateLimiteCandidature, { message: 'La date limite de candidature est obligatoire.' });
    validate(champ.dateLimiteCandidature, ({ value }) => value() && value() < aujourdhui()
      ? { kind: 'passee', message: 'La date limite ne peut pas être passée.' } : undefined);
    validate(champ.dateDebutPrevue, ({ value, valueOf }) => value() && valueOf(champ.dateLimiteCandidature) && value() < valueOf(champ.dateLimiteCandidature)
      ? { kind: 'avant', message: 'Le stage ne peut pas commencer avant la date limite de candidature.' } : undefined);
    required(champ.description, { message: 'Décrivez les missions du stage.' });
    maxLength(champ.description, 5000, { message: '5000 caractères au maximum.' });
    required(champ.competences, { message: 'Indiquez les compétences attendues.' });
    maxLength(champ.competences, 1000, { message: '1000 caractères au maximum.' });
  });

  /** Organismes connus dont le nom ressemble à la saisie (administration seulement). */
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.modele().organisme.trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  protected readonly enCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly publiee = signal<OffreStage | null>(null);
  /** Fichiers que l’offre créée n’a pas pu recevoir : l’offre existe, on dit ce qui manque. */
  protected readonly echecsFichiers = signal<readonly string[]>([]);

  protected readonly formatImage = FORMAT_OFFRE_STAGE;
  /** Image en cours de recadrage, puis image recadrée prête à l’envoi et son aperçu. */
  protected readonly imageARecadrer = signal<HTMLImageElement | null>(null);
  protected readonly fichierImage = signal<File | null>(null);
  protected readonly apercuImage = signal<string | null>(null);
  protected readonly erreurImage = signal<string | null>(null);
  protected readonly avertissementImage = signal<string | null>(null);
  protected readonly pieces = signal<readonly File[]>([]);
  protected readonly erreurPieces = signal<string | null>(null);
  protected readonly piecesMax = PIECES_JOINTES_MAX;
  private readonly resultat = viewChild<ElementRef<HTMLElement>>('resultat');

  constructor() {
    if (!this.administration) return;
    toObservable(this.modele).pipe(
      map(({ organisme }) => organisme.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((saisie) => saisie.length < 2 ? of([]) : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  ngOnDestroy(): void {
    this.fermerRecadrage();
    this.remplacerApercu(null);
  }

  /** Une image choisie passe d’abord par le recadrage : seul le format 16:9 est envoyé. */
  protected async selectionnerImage(evenement: Event): Promise<void> {
    const champ = evenement.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = '';
    if (!fichier) return;
    this.erreurImage.set(null);
    this.avertissementImage.set(null);
    try {
      this.fermerRecadrage();
      const image = await chargerImagePourRecadrage(fichier, FORMAT_OFFRE_STAGE);
      if (estPetite({ largeur: image.naturalWidth, hauteur: image.naturalHeight }, FORMAT_OFFRE_STAGE)) {
        this.avertissementImage.set(`Image de petite taille (${image.naturalWidth} × ${image.naturalHeight} pixels) : elle pourra paraître un peu floue.`);
      }
      this.imageARecadrer.set(image);
    } catch (erreur) {
      this.erreurImage.set(erreur instanceof Error ? erreur.message : 'Cette image ne peut pas être utilisée.');
    }
  }

  protected appliquerRecadrage(fichier: File): void {
    this.fermerRecadrage();
    this.fichierImage.set(fichier);
    this.remplacerApercu(URL.createObjectURL(fichier));
  }

  protected annulerRecadrage(): void {
    this.fermerRecadrage();
    this.avertissementImage.set(null);
  }

  protected retirerImage(): void {
    this.fichierImage.set(null);
    this.remplacerApercu(null);
    this.avertissementImage.set(null);
  }

  /** Ajoute les PDF choisis à la liste, dans la limite de trois et de 5 Mo chacun. */
  protected ajouterPieces(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const choisis = [...(champ.files ?? [])];
    champ.value = '';
    this.erreurPieces.set(null);
    const refus: string[] = [];
    const acceptes = choisis.filter((fichier) => {
      const pdf = fichier.type === 'application/pdf' && fichier.name.toLowerCase().endsWith('.pdf');
      if (!pdf) refus.push(`« ${fichier.name} » n’est pas un PDF`);
      else if (fichier.size > POIDS_MAX_PIECE) refus.push(`« ${fichier.name} » dépasse 5 Mo`);
      return pdf && fichier.size <= POIDS_MAX_PIECE;
    });
    const place = PIECES_JOINTES_MAX - this.pieces().length;
    if (acceptes.length > place) refus.push(`${PIECES_JOINTES_MAX} pièces jointes au plus`);
    this.pieces.update((liste) => [...liste, ...acceptes.slice(0, Math.max(place, 0))]);
    if (refus.length) this.erreurPieces.set(refus.join(' ; ') + '.');
  }

  protected retirerPiece(index: number): void {
    this.pieces.update((liste) => liste.filter((_, i) => i !== index));
    this.erreurPieces.set(null);
  }

  protected async envoyer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    const saisie = this.modele();
    const contenu: OffreStageRequete = {
      titre: saisie.titre.trim(),
      typeStage: saisie.typeStage as TypeStage,
      dureeMois: entier(saisie.dureeMois) ?? 0,
      lieu: saisie.lieu.trim() || null,
      dateDebutPrevue: saisie.dateDebutPrevue || null,
      nombrePlaces: entier(saisie.nombrePlaces),
      dateLimiteCandidature: saisie.dateLimiteCandidature,
      description: saisie.description.trim(),
      competences: saisie.competences.trim(),
    };
    const connu = this.organismeConnu();
    const requete = this.administration
      ? this.service.saisir(contenu, connu ? { organismeId: connu.id } : { nomNouvelOrganisme: saisie.organisme.trim() })
      : this.service.publier(contenu);
    if (this.enCours()) return;
    this.enCours.set(true);
    this.messageErreur.set(null);
    let offre: OffreStage;
    try {
      offre = await firstValueFrom(requete);
    } catch (erreur) {
      this.enCours.set(false);
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message : 'La publication a échoué. Réessayez.');
      return;
    }
    // L’offre existe : chaque fichier est envoyé à part, un échec n’annule pas les autres.
    const echecs: string[] = [];
    const image = this.fichierImage();
    if (image) {
      try {
        offre = await firstValueFrom(this.service.joindreImage(offre.id, image));
      } catch (erreur) {
        echecs.push(`l’image (${this.motif(erreur)})`);
      }
    }
    for (const piece of this.pieces()) {
      try {
        offre = await firstValueFrom(this.service.ajouterPiece(offre.id, piece));
      } catch (erreur) {
        echecs.push(`« ${piece.name} » (${this.motif(erreur)})`);
      }
    }
    this.enCours.set(false);
    this.echecsFichiers.set(echecs);
    this.publiee.set(offre);
    afterNextRender(() => this.resultat()?.nativeElement.focus(), { injector: this.injector });
  }

  private motif(erreur: unknown): string {
    return erreur instanceof HttpErrorResponse && erreur.error?.message ? erreur.error.message : 'envoi impossible';
  }

  private fermerRecadrage(): void {
    const image = this.imageARecadrer();
    if (image) URL.revokeObjectURL(image.src);
    this.imageARecadrer.set(null);
  }

  private remplacerApercu(url: string | null): void {
    const ancien = this.apercuImage();
    if (ancien) URL.revokeObjectURL(ancien);
    this.apercuImage.set(url);
  }

  protected recommencer(): void {
    this.modele.set({ ...VIERGE });
    this.formulaire().reset();
    this.publiee.set(null);
    this.echecsFichiers.set([]);
    this.retirerImage();
    this.pieces.set([]);
    this.erreurPieces.set(null);
    this.erreurImage.set(null);
  }
}
