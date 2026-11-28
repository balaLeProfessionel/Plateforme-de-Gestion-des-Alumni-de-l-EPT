import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, Injector, input, OnInit, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { email, FormField, form, maxLength, required, validate } from '@angular/forms/signals';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { FilieresService } from '../../../core/services/filieres/filieres';
import { AccueilRequete, anneeUniversitaire, LIBELLES_TYPE_MOBILITE, Mobilite, TypeMobilite } from '../../../core/services/models/mobilite.model';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import { OffresMobiliteService } from '../../../core/services/mobilites/offres-mobilite';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

/**
 * Un étudiant accueilli à l’EPT : proposé par son établissement (corrigeable tant que l’école ne l’a pas traité), ou
 * saisi par le chef du service mobilité au nom d’un établissement (`administration`). Identité et programme seulement.
 */
@Component({
  selector: 'app-formulaire-accueil',
  imports: [FormField],
  templateUrl: './formulaire-accueil.html',
  styleUrl: './formulaire-accueil.scss',
})
export class FormulaireAccueil implements OnInit {
  private readonly service = inject(OffresMobiliteService);
  private readonly organismeService = inject(OrganismeService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly initial = input<Mobilite | null>(null);
  readonly administration = input(false);
  readonly enregistree = output<Mobilite>();
  readonly annulee = output<void>();

  protected readonly filieres = inject(FilieresService).proposees();
  protected readonly types: readonly TypeMobilite[] = ['ECHANGE', 'DOUBLE_DIPLOME'];
  protected readonly libellesType = LIBELLES_TYPE_MOBILITE;
  protected readonly annees = [0, 1, 2].map((d) => anneeUniversitaire(new Date(), d));
  protected readonly modele = signal({
    organisme: '', prenom: '', nom: '', email: '', programmeOrigine: '', filiereAccueilId: '', type: 'ECHANGE' as TypeMobilite | '',
    anneeUniversitaire: anneeUniversitaire(new Date(), 1), dateDebut: '', dateFin: '',
  });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.organisme, { message: 'Indiquez l’établissement d’origine.', when: () => this.administration() });
    required(champ.prenom, { message: 'Le prénom est obligatoire.' });
    maxLength(champ.prenom, 100, { message: '100 caractères au maximum.' });
    required(champ.nom, { message: 'Le nom est obligatoire.' });
    maxLength(champ.nom, 100, { message: '100 caractères au maximum.' });
    email(champ.email, { message: 'Adresse e-mail invalide.' });
    required(champ.programmeOrigine, { message: 'Le programme d’origine est obligatoire.' });
    maxLength(champ.programmeOrigine, 150, { message: '150 caractères au maximum.' });
    required(champ.filiereAccueilId, { message: 'Choisissez la filière d’accueil.' });
    required(champ.type, { message: 'Choisissez le type de mobilité.' });
    validate(champ.dateFin, ({ value, valueOf }) => value() && valueOf(champ.dateDebut) && value() < valueOf(champ.dateDebut)
      ? { kind: 'ordre', message: 'La fin du séjour ne peut pas précéder son début.' } : undefined);
  });
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.modele().organisme.trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    toObservable(this.modele).pipe(
      map(({ organisme }) => organisme.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((saisie) => !this.administration() || saisie.length < 2 ? of([])
        : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  ngOnInit(): void {
    const m = this.initial();
    if (!m) return;
    this.modele.set({
      organisme: m.organisme.nom, prenom: m.personne.prenom, nom: m.personne.nom, email: m.personne.email ?? '',
      programmeOrigine: m.programmeOrigine ?? '', filiereAccueilId: m.filiereAccueilId ?? '', type: m.type,
      anneeUniversitaire: m.anneeUniversitaire, dateDebut: m.dateDebut ?? '', dateFin: m.dateFin ?? '',
    });
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
    const accueil: AccueilRequete = {
      prenom: s.prenom.trim(), nom: s.nom.trim(), email: s.email.trim() || null, programmeOrigine: s.programmeOrigine.trim(),
      filiereAccueilId: s.filiereAccueilId, type: s.type as TypeMobilite, anneeUniversitaire: s.anneeUniversitaire,
      dateDebut: s.dateDebut || null, dateFin: s.dateFin || null,
    };
    const initial = this.initial();
    const connu = this.organismeConnu();
    const requete = this.administration()
      ? this.service.saisirEntrante(accueil, connu ? { organismeId: connu.id } : { nomNouvelOrganisme: s.organisme.trim() })
      : initial ? this.service.modifierAccueil(initial.id, accueil) : this.service.proposerAccueil(accueil);
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: (mobilite) => {
        this.enCours.set(false);
        this.enregistree.emit(mobilite);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’enregistrement a échoué. Réessayez.');
      },
    });
  }
}
