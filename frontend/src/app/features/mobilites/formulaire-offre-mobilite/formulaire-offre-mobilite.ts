import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { disabled, FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, firstValueFrom, map, of, switchMap } from 'rxjs';
import { Classe, CLASSES_PAR_CYCLE, LIBELLES_CLASSE } from '../../../core/services/models/classe.model';
import {
  anneeUniversitaire, DEFINITIONS_TYPE_MOBILITE, LIBELLES_PERIODE, LIBELLES_PIECE, LIBELLES_PUBLIC_VISE, LIBELLES_TYPE_MOBILITE, OffreMobilite, OffreMobiliteRequete,
  PERIODES_MOBILITE, PeriodeMobilite, PIECES_OFFRE_MOBILITE_MAX, POIDS_MAX_PIECE_MOBILITE, PUBLICS_VISES, PublicVise, TYPES_MOBILITE,
  TYPES_PIECE, TypeMobilite, TypePiece,
} from '../../../core/services/models/mobilite.model';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';
import { TaillePipe } from '../../../shared/taille-fichier';

interface Saisie {
  organisme: string;
  titre: string;
  type: TypeMobilite | '';
  publicVise: PublicVise | '';
  pays: string;
  ville: string;
  anneeUniversitaire: string;
  periode: PeriodeMobilite | '';
  dureeSemaines: string;
  nombrePlaces: string;
  dateLimite: string;
  description: string;
  filiereIds: string[];
  classes: Classe[];
  piecesDemandees: TypePiece[];
}

function vierge(): Saisie {
  return {
    organisme: '', titre: '', type: 'ECHANGE', publicVise: '', pays: '', ville: '', anneeUniversitaire: anneeUniversitaire(new Date(), 1),
    periode: '', dureeSemaines: '', nombrePlaces: '', dateLimite: '', description: '', filiereIds: [], classes: [],
    piecesDemandees: ['LETTRE_MOTIVATION', 'RELEVES_NOTES'],
  };
}

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
 * Publication ou modification d’une offre de mobilité. L’institut publie pour lui-même ; le chef du service mobilité
 * (route data `administration`) publie au nom d’un établissement existant ou nouveau ; une route avec `:id` modifie
 * l’offre. Les règles entre champs reprennent celles du serveur, qui les vérifie de nouveau.
 */
@Component({
  selector: 'app-formulaire-offre-mobilite',
  imports: [FormField, RouterLink, BoutonRetour, TaillePipe],
  templateUrl: './formulaire-offre-mobilite.html',
  styleUrl: './formulaire-offre-mobilite.scss',
})
export class FormulaireOffreMobilite {
  private readonly service = inject(OffresMobiliteService);
  private readonly organismeService = inject(OrganismeService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly route = inject(ActivatedRoute);

  protected readonly administration = this.route.snapshot.data['administration'] === true;
  protected readonly idModifiee = this.route.snapshot.paramMap.get('id');
  protected readonly secours = this.idModifiee ? `/mobilites/offres/${this.idModifiee}`
    : this.administration ? '/admin/mobilites/offres' : '/mobilites/mes-offres';
  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly types = TYPES_MOBILITE;
  protected readonly libellesType = LIBELLES_TYPE_MOBILITE;
  protected readonly definitionsType = DEFINITIONS_TYPE_MOBILITE;
  protected readonly publics = PUBLICS_VISES;
  protected readonly libellesPublic = LIBELLES_PUBLIC_VISE;
  protected readonly periodes = PERIODES_MOBILITE;
  protected readonly libellesPeriode = LIBELLES_PERIODE;
  protected readonly typesPiece = TYPES_PIECE;
  protected readonly libellesPiece = LIBELLES_PIECE;
  protected readonly cycles = CLASSES_PAR_CYCLE;
  protected readonly libellesClasse = LIBELLES_CLASSE;
  protected readonly annees = [0, 1, 2].map((decalage) => anneeUniversitaire(new Date(), decalage));

  protected readonly modele = signal<Saisie>(vierge());
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.organisme, { message: 'Indiquez l’établissement.', when: () => this.administration && !this.idModifiee });
    maxLength(champ.organisme, 150, { message: '150 caractères au maximum.' });
    required(champ.titre, { message: 'Le titre est obligatoire.' });
    maxLength(champ.titre, 150, { message: '150 caractères au maximum.' });
    required(champ.type, { message: 'Choisissez le type de mobilité.' });
    required(champ.publicVise, { message: 'Choisissez le public visé.' });
    validate(champ.publicVise, ({ value, valueOf }) => {
      const type = valueOf(champ.type);
      if (type === 'DOUBLE_DIPLOME' && value() && value() !== 'ETUDIANTS') {
        return { kind: 'public', message: 'Un double diplôme s’adresse aux étudiants.' };
      }
      if (type === 'ENSEIGNEMENT_RECHERCHE' && value() && value() !== 'ENSEIGNANTS') {
        return { kind: 'public', message: 'Un séjour d’enseignement ou de recherche s’adresse aux enseignants.' };
      }
      return undefined;
    });
    required(champ.pays, { message: 'Le pays est obligatoire.' });
    maxLength(champ.pays, 100, { message: '100 caractères au maximum.' });
    maxLength(champ.ville, 100, { message: '100 caractères au maximum.' });
    required(champ.periode, { message: 'Choisissez la période.' });
    required(champ.dureeSemaines, { message: 'Indiquez la durée du séjour en semaines.', when: ({ valueOf }) => valueOf(champ.periode) === 'SEJOUR' });
    validate(champ.dureeSemaines, ({ value }) => {
      const duree = entier(value());
      return value().trim() && (duree === null || duree < 1 || duree > 52)
        ? { kind: 'duree', message: 'Indiquez un nombre de semaines entre 1 et 52.' } : undefined;
    });
    required(champ.nombrePlaces, { message: 'Le nombre de places est obligatoire.' });
    validate(champ.nombrePlaces, ({ value }) => {
      const places = entier(value());
      return value().trim() && (places === null || places < 1 || places > 100)
        ? { kind: 'places', message: 'Indiquez un nombre entre 1 et 100.' } : undefined;
    });
    required(champ.dateLimite, { message: 'La date limite de candidature est obligatoire.' });
    validate(champ.dateLimite, ({ value }) => value() && value() < aujourdhui() && value() !== this.dateLimiteInitiale
      ? { kind: 'passee', message: 'La date limite ne peut pas être passée.' } : undefined);
    required(champ.description, { message: 'Décrivez le programme.' });
    maxLength(champ.description, 5000, { message: '5000 caractères au maximum.' });
    validate(champ.piecesDemandees, ({ value }) => value().length === 0
      ? { kind: 'pieces', message: 'Indiquez au moins une pièce à fournir.' } : undefined);
    // Des candidats ont postulé à ces conditions : seules la date limite (prolongée) et les places (ajoutées) changent.
    for (const fige of [champ.titre, champ.type, champ.publicVise, champ.pays, champ.ville, champ.anneeUniversitaire, champ.periode,
      champ.dureeSemaines, champ.description]) {
      disabled(fige, () => this.verrouillee());
    }
    validate(champ.nombrePlaces, ({ value }) => this.verrouillee() && (entier(value()) ?? 0) < this.placesInitiales
      ? { kind: 'moins', message: `Des candidatures sont arrivées : ${this.placesInitiales} places au moins.` } : undefined);
    validate(champ.dateLimite, ({ value }) => this.verrouillee() && value() && value() < this.dateLimiteInitiale
      ? { kind: 'avancee', message: 'Des candidatures sont arrivées : la date limite peut seulement être prolongée.' } : undefined);
  });

  /** L’offre a reçu des candidatures : ses conditions sont figées. */
  protected readonly verrouillee = signal(false);
  private placesInitiales = 0;

  /** Filières et classes ne concernent que les offres ouvertes aux étudiants. */
  protected readonly pourEtudiants = computed(() => ['ETUDIANTS', 'TOUS'].includes(this.modele().publicVise));
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.modele().organisme.trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  protected readonly chargement = signal(this.idModifiee !== null);
  protected readonly erreurChargement = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly enregistree = signal<OffreMobilite | null>(null);
  protected readonly echecsFichiers = signal<readonly string[]>([]);
  protected readonly pieces = signal<readonly File[]>([]);
  protected readonly erreurPieces = signal<string | null>(null);
  protected readonly piecesMax = PIECES_OFFRE_MOBILITE_MAX;
  private dateLimiteInitiale = '';
  private readonly resultat = viewChild<ElementRef<HTMLElement>>('resultat');

  constructor() {
    if (this.idModifiee) {
      this.service.detail(this.idModifiee).pipe(takeUntilDestroyed()).subscribe({
        next: (offre) => {
          this.dateLimiteInitiale = offre.dateLimite;
          this.placesInitiales = offre.nombrePlaces;
          this.verrouillee.set((offre.nombreCandidatures ?? 0) > 0);
          this.modele.set({
            organisme: offre.organisme.nom, titre: offre.titre, type: offre.type, publicVise: offre.publicVise, pays: offre.pays,
            ville: offre.ville ?? '', anneeUniversitaire: offre.anneeUniversitaire, periode: offre.periode,
            dureeSemaines: offre.dureeSemaines?.toString() ?? '', nombrePlaces: offre.nombrePlaces.toString(), dateLimite: offre.dateLimite,
            description: offre.description, filiereIds: offre.filieres.map((f) => f.id), classes: [...offre.classes],
            piecesDemandees: [...offre.piecesDemandees],
          });
          this.erreurChargement.set(offre.modifiable && offre.statut === 'PUBLIEE' ? null : 'Cette offre ne se modifie plus.');
          this.chargement.set(false);
        },
        error: (erreur: HttpErrorResponse) => {
          this.erreurChargement.set(erreur.status === 404 ? 'Cette offre n’existe pas.' : erreur.error?.message ?? 'Impossible de charger l’offre.');
          this.chargement.set(false);
        },
      });
    }
    if (!this.administration || this.idModifiee) return;
    toObservable(this.modele).pipe(
      map(({ organisme }) => organisme.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((saisie) => saisie.length < 2 ? of([]) : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  protected basculerFiliere(id: string): void {
    this.modele.update((s) => ({ ...s, filiereIds: s.filiereIds.includes(id) ? s.filiereIds.filter((f) => f !== id) : [...s.filiereIds, id] }));
  }

  protected basculerClasse(classe: Classe): void {
    this.modele.update((s) => ({ ...s, classes: s.classes.includes(classe) ? s.classes.filter((c) => c !== classe) : [...s.classes, classe] }));
  }

  protected basculerPiece(piece: TypePiece): void {
    this.modele.update((s) => ({
      ...s, piecesDemandees: s.piecesDemandees.includes(piece) ? s.piecesDemandees.filter((p) => p !== piece) : [...s.piecesDemandees, piece],
    }));
    this.formulaire.piecesDemandees().markAsTouched();
  }

  /** Ajoute les PDF choisis à la liste, dans la limite de cinq et de 5 Mo chacun. */
  protected ajouterPieces(evenement: Event): void {
    const champ = evenement.target as HTMLInputElement;
    const choisis = [...(champ.files ?? [])];
    champ.value = '';
    this.erreurPieces.set(null);
    const refus: string[] = [];
    const acceptes = choisis.filter((fichier) => {
      const pdf = fichier.type === 'application/pdf' && fichier.name.toLowerCase().endsWith('.pdf');
      if (!pdf) refus.push(`« ${fichier.name} » n’est pas un PDF`);
      else if (fichier.size > POIDS_MAX_PIECE_MOBILITE) refus.push(`« ${fichier.name} » dépasse 5 Mo`);
      return pdf && fichier.size <= POIDS_MAX_PIECE_MOBILITE;
    });
    const place = PIECES_OFFRE_MOBILITE_MAX - this.pieces().length;
    if (acceptes.length > place) refus.push(`${PIECES_OFFRE_MOBILITE_MAX} documents au plus`);
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
    if (this.enCours()) return;
    const saisie = this.modele();
    const etudiants = this.pourEtudiants();
    const contenu: OffreMobiliteRequete = {
      titre: saisie.titre.trim(),
      description: saisie.description.trim(),
      type: saisie.type as TypeMobilite,
      publicVise: saisie.publicVise as PublicVise,
      pays: saisie.pays.trim(),
      ville: saisie.ville.trim() || null,
      anneeUniversitaire: saisie.anneeUniversitaire,
      periode: saisie.periode as PeriodeMobilite,
      dureeSemaines: saisie.periode === 'SEJOUR' ? entier(saisie.dureeSemaines) : null,
      nombrePlaces: entier(saisie.nombrePlaces) ?? 0,
      dateLimite: saisie.dateLimite,
      filiereIds: etudiants ? saisie.filiereIds : [],
      classes: etudiants ? saisie.classes : [],
      piecesDemandees: saisie.piecesDemandees,
    };
    const connu = this.organismeConnu();
    const requete = this.idModifiee ? this.service.modifier(this.idModifiee, contenu)
      : this.administration
        ? this.service.publierParChef(contenu, connu ? { organismeId: connu.id } : { nomNouvelOrganisme: saisie.organisme.trim() })
        : this.service.publier(contenu);
    this.enCours.set(true);
    this.messageErreur.set(null);
    let offre: OffreMobilite;
    try {
      offre = await firstValueFrom(requete);
    } catch (erreur) {
      this.enCours.set(false);
      this.messageErreur.set(erreur instanceof HttpErrorResponse && erreur.error?.message
        ? erreur.error.message : 'L’enregistrement a échoué. Réessayez.');
      return;
    }
    // L’offre existe : chaque document est envoyé à part, un échec n’annule pas les autres.
    const echecs: string[] = [];
    for (const piece of this.pieces()) {
      try {
        offre = await firstValueFrom(this.service.ajouterPiece(offre.id, piece));
      } catch (erreur) {
        echecs.push(`« ${piece.name} » (${erreur instanceof HttpErrorResponse && erreur.error?.message ? erreur.error.message : 'envoi impossible'})`);
      }
    }
    this.enCours.set(false);
    this.echecsFichiers.set(echecs);
    this.enregistree.set(offre);
    afterNextRender(() => this.resultat()?.nativeElement.focus(), { injector: this.injector });
  }

  protected recommencer(): void {
    this.modele.set(vierge());
    this.formulaire().reset();
    this.enregistree.set(null);
    this.echecsFichiers.set([]);
    this.pieces.set([]);
    this.erreurPieces.set(null);
  }
}
