import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, Injector, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import { Accord, Convention, LIBELLES_TYPE_ACCORD, TypeAccord } from '../../../core/services/models/partenariat.model';
import { AccordsService } from '../../../core/services/partenariats/accords';
import { ConventionsPartenariatService } from '../../../core/services/partenariats/conventions-partenariat';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

const AUJOURDHUI = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Africa/Dakar' }).format(new Date());

/**
 * Proposition d’un accord de stage ou de mobilité, ou sa correction tant que l’autre partie n’a pas répondu
 * (`initial`). Côté école (`administration`), on choisit l’organisme ; la convention-cadre reste facultative.
 */
@Component({
  selector: 'app-formulaire-accord',
  imports: [FormField],
  templateUrl: './formulaire-accord.html',
  styleUrl: './formulaire-accord.scss',
})
export class FormulaireAccord implements OnInit {
  private readonly accords = inject(AccordsService);
  private readonly conventions = inject(ConventionsPartenariatService);
  private readonly organismeService = inject(OrganismeService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly initial = input<Accord | null>(null);
  readonly administration = input(false);
  readonly enregistre = output<Accord>();
  readonly annule = output<void>();

  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly typesAccord: readonly TypeAccord[] = ['STAGE', 'MOBILITE'];
  protected readonly libellesType = LIBELLES_TYPE_ACCORD;
  protected readonly modele = signal({
    organisme: '', conventionId: '', type: 'STAGE' as TypeAccord, objet: '', description: '', nombrePlaces: '',
    filiereIds: [] as string[], dateDebut: '', dateFin: '',
  });
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.modele().organisme.trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  protected readonly conventionsActives = signal<readonly Convention[]>([]);
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.organisme, { message: 'Choisissez l’organisme.', when: () => this.administration() && !this.initial() });
    validate(champ.organisme, ({ value }) => this.administration() && !this.initial() && value().trim() && !this.organismeConnu()
      ? { kind: 'inconnu', message: 'Choisissez un organisme dans la liste proposée.' } : undefined);
    required(champ.objet, { message: 'L’objet est obligatoire.' });
    maxLength(champ.objet, 200, { message: '200 caractères au maximum.' });
    maxLength(champ.description, 2000, { message: '2 000 caractères au maximum.' });
    validate(champ.nombrePlaces, ({ value }) => value() && !/^[1-9]\d{0,3}$/.test(value().trim())
      ? { kind: 'places', message: 'Un nombre entier, au moins 1.' } : undefined);
    required(champ.dateDebut, { message: 'La date de début est obligatoire.' });
    required(champ.dateFin, { message: 'La date de fin est obligatoire.' });
    validate(champ.dateFin, ({ value, valueOf }) => {
      if (!value()) return undefined;
      if (valueOf(champ.dateDebut) && value() < valueOf(champ.dateDebut)) return { kind: 'ordre', message: 'La fin doit suivre le début.' };
      return value() < AUJOURDHUI ? { kind: 'passee', message: 'La date de fin est déjà passée.' } : undefined;
    });
  });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    // Côté école : suggestions d’organismes, puis ses conventions actives une fois l’organisme reconnu.
    toObservable(this.modele).pipe(
      map(({ organisme }) => organisme.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((saisie) => !this.administration() || this.initial() || saisie.length < 2 ? of([])
        : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe((liste) => this.suggestions.set(liste));
    toObservable(this.organismeConnu).pipe(
      map((o) => o?.id ?? null),
      distinctUntilChanged(),
      switchMap((id) => this.administration() && !this.initial() ? this.conventionsDe(id) : of(null)),
      takeUntilDestroyed(),
    ).subscribe((liste) => { if (liste) this.conventionsActives.set(liste); });
  }

  ngOnInit(): void {
    const a = this.initial();
    if (a) {
      this.modele.set({
        organisme: a.organismeNom, conventionId: a.conventionId ?? '', type: a.type, objet: a.objet, description: a.description ?? '',
        nombrePlaces: a.nombrePlaces ? String(a.nombrePlaces) : '', filiereIds: a.filieres.map((f) => f.id), dateDebut: a.dateDebut, dateFin: a.dateFin,
      });
      this.conventionsDe(a.organismeId).subscribe((liste) => this.conventionsActives.set(liste));
    } else if (!this.administration()) {
      this.conventions.mesConventions().pipe(catchError(() => of([]))).subscribe((liste) =>
        this.conventionsActives.set(liste.filter((c) => c.statut === 'ACTIVE')));
    }
  }

  protected basculerFiliere(id: string): void {
    this.modele.update((m) => ({
      ...m, filiereIds: m.filiereIds.includes(id) ? m.filiereIds.filter((f) => f !== id) : [...m.filiereIds, id],
    }));
  }

  protected envoyer(evenement: Event): void {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    if (this.enCours()) return;
    const s = this.modele();
    const initial = this.initial();
    const requete = {
      organismeId: this.administration() && !initial ? this.organismeConnu()?.id ?? null : null,
      conventionId: s.conventionId || null, type: s.type, objet: s.objet.trim(), description: s.description.trim() || null,
      nombrePlaces: s.nombrePlaces.trim() ? Number(s.nombrePlaces) : null, filiereIds: s.filiereIds, dateDebut: s.dateDebut, dateFin: s.dateFin,
    };
    this.enCours.set(true);
    this.erreur.set(null);
    (initial ? this.accords.modifier(initial.id, requete, this.administration()) : this.accords.proposer(requete, this.administration())).subscribe({
      next: (accord) => {
        this.enCours.set(false);
        this.enregistre.emit(accord);
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(e.error?.message ?? 'L’envoi a échoué. Réessayez.');
      },
    });
  }

  /** Conventions actives d’un organisme : par l’administration côté école, par ses propres conventions sinon. */
  private conventionsDe(organismeId: string | null): Observable<Convention[]> {
    if (!organismeId) return of([]);
    if (!this.administration()) {
      return this.conventions.mesConventions().pipe(map((l) => l.filter((c) => c.statut === 'ACTIVE')), catchError(() => of([])));
    }
    return this.conventions.lister({ statut: 'ACTIVE', recherche: '', expireBientot: false, page: 0 }, 48, organismeId).pipe(
      map((page) => page.contenu), catchError(() => of([])));
  }
}
