import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { catchError, debounceTime, filter, map, of, switchMap, tap } from 'rxjs';
import { AdminCommunautesService, CriteresCommunautes, ResumeCommunautes } from '../../../core/services/admin/admin-communautes';
import { Page } from '../../../core/services/models/mentorat.model';
import {
  CategorieCommunaute, CommunauteAdmin, ICONES_CATEGORIE, LIBELLES_CATEGORIE,
} from '../../../core/services/models/messagerie.model';
import { DateRelativePipe } from '../../../shared/dates/date-relative';
import { AvatarGroupe } from '../../messagerie/avatar-groupe';
import { messageServeur } from '../../messagerie/message-erreur';
import { PageAdmin } from '../page-admin/page-admin';
import { PaginationAdmin } from '../pagination-admin/pagination-admin';
import { FenetreCommunaute } from './fenetre-communaute';

const DELAI_SAISIE_MS = 300;
/** Celles que l’administration crée d’abord, puis celles qui naissent des profils. */
const CATEGORIES: readonly CategorieCommunaute[] = ['VILLE', 'SECTEUR', 'INTERET', 'PROMO', 'FILIERE', 'PROMO_FILIERE'];

/** Fenêtre ouverte : création, ou modification d’une communauté. */
type Edition = { communaute: CommunauteAdmin | null } | null;

interface Filtre {
  valeur: CategorieCommunaute | '';
  libelle: string;
  icone: string | null;
  nombre: number | null;
}

function pluriel(nombre: number, mot: string): string {
  return `${nombre} ${mot}${nombre > 1 ? 's' : ''}`;
}

/**
 * Communautés de la messagerie, vues par l’administration : toutes, filtrées par nom et par catégorie
 * (avec le nombre de chacune) ; créer une communauté de ville, de secteur ou d’intérêt, et modifier nom,
 * description et accès. L’administration n’en devient pas membre.
 */
@Component({
  selector: 'app-communautes-admin',
  imports: [FormField, PageAdmin, PaginationAdmin, AvatarGroupe, DateRelativePipe, FenetreCommunaute],
  templateUrl: './communautes.html',
  styleUrls: ['../etats-admin.scss', './communautes.scss'],
})
export class CommunautesAdmin {
  private readonly service = inject(AdminCommunautesService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly libelles = LIBELLES_CATEGORIE;
  protected readonly icones = ICONES_CATEGORIE;

  protected readonly modele = signal<CriteresCommunautes>({ recherche: '', categorie: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.recherche, 100, { message: '100 caractères maximum.' });
  });
  /** Critères appliqués : la recherche y arrive après une pause de frappe, la catégorie tout de suite. */
  protected readonly criteres = signal<CriteresCommunautes>({ recherche: '', categorie: '' });
  protected readonly page = signal(0);
  private readonly version = signal(0);

  protected readonly resultat = signal<Page<CommunauteAdmin> | null>(null);
  protected readonly resumeCategories = signal<ResumeCommunautes | null>(null);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  /** Confirmation de la dernière création ou modification. */
  protected readonly message = signal('');
  /** Nombre de résultats d’un filtre, annoncé aux lecteurs d’écran. */
  protected readonly annonceResultats = signal('');
  protected readonly edition = signal<Edition>(null);

  protected readonly communautes = computed(() => this.resultat()?.contenu ?? []);
  protected readonly filtre = computed(() => this.criteres().recherche !== '' || this.criteres().categorie !== '');
  protected readonly resume = computed(() => pluriel(this.resultat()?.totalElements ?? 0, 'communauté'));
  protected readonly filtres = computed<Filtre[]>(() => {
    const resume = this.resumeCategories();
    return [
      { valeur: '', libelle: 'Toutes', icone: null, nombre: resume?.total ?? null },
      ...CATEGORIES.map((categorie) => ({
        valeur: categorie, libelle: LIBELLES_CATEGORIE[categorie], icone: ICONES_CATEGORIE[categorie],
        nombre: resume?.parCategorie[categorie] ?? null,
      })),
    ];
  });
  /** Ce qui n’a rien donné, pour l’état vide. */
  protected readonly sansResultat = computed(() => {
    const { recherche, categorie } = this.criteres();
    if (recherche) return `Aucune communauté ne correspond à « ${recherche} »${categorie ? ` parmi « ${LIBELLES_CATEGORIE[categorie]} »` : ''}.`;
    return categorie ? `Aucune communauté dans « ${LIBELLES_CATEGORIE[categorie]} ».` : '';
  });

  /** Bouton qui a ouvert la fenêtre : il retrouve le focus à la fermeture. */
  private declencheur: HTMLElement | null = null;
  /** Communauté à remettre en focus après le rechargement qui suit sa création. */
  private aFocaliser: string | null = null;
  /** Après un changement de page, le focus va au début de la nouvelle page une fois chargée. */
  private focaliserResume = false;

  constructor() {
    this.chargerResume();

    toObservable(this.modele).pipe(
      debounceTime(DELAI_SAISIE_MS),
      filter(() => this.formulaire().valid()),
      map(({ recherche }) => recherche.trim()),
      takeUntilDestroyed(),
    ).subscribe((recherche) => this.appliquer({ ...this.criteres(), recherche }));

    toObservable(computed(() => ({ criteres: this.criteres(), page: this.page(), version: this.version() }))).pipe(
      tap(() => this.chargement.set(true)),
      switchMap(({ criteres, page }) => this.service.lister(criteres, page).pipe(
        map((resultat) => ({ resultat, erreur: null })),
        catchError((erreur: unknown) => of({
          resultat: null, erreur: messageServeur(erreur, 'Impossible de charger les communautés.'),
        })),
      )),
      takeUntilDestroyed(),
    ).subscribe(({ resultat, erreur }) => {
      this.resultat.set(resultat);
      this.erreur.set(erreur);
      this.chargement.set(false);
      const total = resultat?.totalElements ?? 0;
      this.annonceResultats.set(this.filtre() && resultat
        ? (total === 0 ? 'Aucune communauté trouvée.' : `${pluriel(total, 'communauté')} trouvée${total > 1 ? 's' : ''}.`) : '');
      this.restaurerFocus();
    });
  }

  protected choisirCategorie(categorie: CategorieCommunaute | ''): void {
    this.modele.update((valeurs) => ({ ...valeurs, categorie }));
    this.appliquer({ recherche: this.modele().recherche.trim(), categorie });
  }

  protected ouvrir(communaute: CommunauteAdmin | null, evenement: Event): void {
    this.declencheur = evenement.currentTarget instanceof HTMLElement ? evenement.currentTarget : null;
    this.message.set('');
    this.edition.set({ communaute });
  }

  protected enregistree(communaute: CommunauteAdmin, creation: boolean): void {
    this.message.set(creation ? `La communauté « ${communaute.nom} » est créée.` : `« ${communaute.nom} » est enregistrée.`);
    if (creation) {
      // La nouvelle communauté se montre seule : on la cherche par son nom, et le focus va sur elle.
      this.aFocaliser = communaute.id;
      this.declencheur = null;
      this.modele.set({ recherche: communaute.nom, categorie: '' });
      this.appliquer({ recherche: communaute.nom, categorie: '' });
      this.chargerResume();
    } else {
      this.version.update((version) => version + 1);
    }
  }

  protected fermee(): void {
    this.edition.set(null);
    const declencheur = this.declencheur;
    this.declencheur = null;
    if (declencheur?.isConnected) declencheur.focus();
  }

  protected changerPage(numero: number): void {
    this.focaliserResume = true;
    this.page.set(numero);
  }

  protected reessayer(): void {
    this.version.update((version) => version + 1);
  }

  protected effacerFiltres(): void {
    this.modele.set({ recherche: '', categorie: '' });
    this.appliquer({ recherche: '', categorie: '' });
    this.hote.nativeElement.querySelector<HTMLInputElement>('#recherche-communautes-admin')?.focus();
  }

  /** De nouveaux critères repartent de la première page ; les mêmes ne relancent rien. */
  private appliquer(criteres: CriteresCommunautes): void {
    const actuels = this.criteres();
    if (criteres.recherche === actuels.recherche && criteres.categorie === actuels.categorie) return;
    this.criteres.set(criteres);
    this.page.set(0);
  }

  private chargerResume(): void {
    this.service.resume().pipe(catchError(() => of(null))).subscribe((resume) => this.resumeCategories.set(resume));
  }

  private restaurerFocus(): void {
    if (this.focaliserResume) {
      this.focaliserResume = false;
      afterNextRender(() => {
        const resume = this.hote.nativeElement.querySelector<HTMLElement>('#resume-communautes');
        resume?.scrollIntoView({ block: 'start' });
        resume?.focus({ preventScroll: true });
      }, { injector: this.injector });
      return;
    }
    const id = this.aFocaliser;
    if (!id || !this.communautes().some((communaute) => communaute.id === id)) return;
    this.aFocaliser = null;
    afterNextRender(() => this.hote.nativeElement.querySelector<HTMLElement>(`[data-communaute="${id}"] .modifier`)?.focus(),
      { injector: this.injector });
  }
}
