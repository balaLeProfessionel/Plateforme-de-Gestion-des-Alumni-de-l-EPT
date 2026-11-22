import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, filter, map, of, startWith, switchMap, tap } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { AnnuaireMembre } from '../../../core/services/models/annuaire.model';
import { ConversationDetail, ICONES_CATEGORIE, NATURES_COMMUNAUTE } from '../../../core/services/models/messagerie.model';
import { CarteMembre } from '../../annuaire/carte-membre/carte-membre';
import { CarteMembreSquelette } from '../../annuaire/carte-membre/carte-membre-squelette';
import { AvatarGroupe } from '../avatar-groupe';
import { messageServeur } from '../message-erreur';

const DELAI_SAISIE_MS = 300;
export const TAILLE_PAGE_MEMBRES = 24;

/**
 * Annuaire d’une communauté (`/messagerie/:id/membres`) : ses membres en cartes, comme dans l’annuaire,
 * avec une recherche par nom, poste, ville ou filière. Une page de plus s’ajoute à la suite, sans quitter la liste.
 */
@Component({
  selector: 'app-annuaire-communaute',
  imports: [RouterLink, FormField, AvatarGroupe, CarteMembre, CarteMembreSquelette],
  templateUrl: './annuaire-communaute.html',
  styleUrl: './annuaire-communaute.scss',
})
export class AnnuaireCommunaute {
  private readonly route = inject(ActivatedRoute);
  private readonly messagerie = inject(MessagerieService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id') ?? '')), { initialValue: '' });
  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele, (chemin) => maxLength(chemin.recherche, 100));

  protected readonly communaute = signal<ConversationDetail | null>(null);
  protected readonly membres = signal<AnnuaireMembre[]>([]);
  protected readonly total = signal(0);
  private readonly page = signal(0);
  private readonly totalPages = signal(0);
  protected readonly chargement = signal(true);
  protected readonly chargementSuite = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly erreurSuite = signal<string | null>(null);
  /** Recherche des résultats affichés : le texte vide dit « tous les membres ». */
  protected readonly rechercheAppliquee = signal('');

  protected readonly icone = computed(() => {
    const categorie = this.communaute()?.categorie;
    return categorie ? ICONES_CATEGORIE[categorie] : null;
  });
  protected readonly nature = computed(() => {
    const categorie = this.communaute()?.categorie;
    return categorie ? NATURES_COMMUNAUTE[categorie] : 'Communauté';
  });
  protected readonly resume = computed(() => {
    const total = this.total();
    const membres = `${total} membre${total > 1 ? 's' : ''}`;
    return this.rechercheAppliquee() ? `${membres} pour « ${this.rechercheAppliquee()} »` : membres;
  });
  protected readonly encoreDesMembres = computed(() => this.page() + 1 < this.totalPages());

  constructor() {
    // Arrivé depuis le menu du fil : le focus se poserait sur la page entière ; on le donne au titre.
    afterNextRender(() => this.hote.nativeElement.querySelector<HTMLElement>('#titre-annuaire')?.focus());

    toObservable(this.id).pipe(
      filter(Boolean),
      switchMap((id) => this.messagerie.obtenir(id).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((detail) => this.communaute.set(detail));

    const recherche$ = toObservable(this.modele).pipe(
      debounceTime(DELAI_SAISIE_MS),
      filter(() => this.formulaire().valid()),
      map(({ recherche }) => recherche.trim()),
      startWith(''),
      distinctUntilChanged(),
    );
    combineLatest([toObservable(this.id).pipe(filter(Boolean)), recherche$]).pipe(
      tap(() => {
        this.chargement.set(true);
        this.erreur.set(null);
        this.erreurSuite.set(null);
      }),
      switchMap(([id, recherche]) => this.messagerie.listerMembresCommunaute(id, 0, recherche, TAILLE_PAGE_MEMBRES).pipe(
        map((resultat) => ({ resultat, recherche, erreur: null })),
        catchError((erreur: unknown) => of({
          resultat: null, recherche, erreur: messageServeur(erreur, 'Impossible de charger les membres. Réessayez.'),
        })),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ resultat, recherche, erreur }) => {
      this.chargement.set(false);
      this.erreur.set(erreur);
      this.rechercheAppliquee.set(recherche);
      this.membres.set(resultat?.contenu ?? []);
      this.total.set(resultat?.totalElements ?? 0);
      this.page.set(resultat?.page ?? 0);
      this.totalPages.set(resultat?.totalPages ?? 0);
    });
  }

  /** Les membres suivants s’ajoutent sous ceux déjà affichés. */
  protected afficherPlus(): void {
    if (this.chargementSuite() || !this.encoreDesMembres()) return;
    this.chargementSuite.set(true);
    this.erreurSuite.set(null);
    this.messagerie.listerMembresCommunaute(this.id(), this.page() + 1, this.rechercheAppliquee(), TAILLE_PAGE_MEMBRES)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultat) => {
          this.chargementSuite.set(false);
          const deja = new Set(this.membres().map((membre) => membre.id));
          this.membres.update((membres) => [...membres, ...resultat.contenu.filter((membre) => !deja.has(membre.id))]);
          this.page.set(resultat.page);
          this.totalPages.set(resultat.totalPages);
          this.total.set(resultat.totalElements);
        },
        error: (erreur: unknown) => {
          this.chargementSuite.set(false);
          this.erreurSuite.set(messageServeur(erreur, 'Impossible de charger la suite. Réessayez.'));
        },
      });
  }

  protected effacerRecherche(): void {
    this.modele.set({ recherche: '' });
  }
}
