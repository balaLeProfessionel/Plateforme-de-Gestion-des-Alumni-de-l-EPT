import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { email, form, FormField, maxLength, required, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { OrganismeSuggestion } from '../../../core/services/models/organisme.model';
import { Declaration, LIBELLES_TYPE_STAGE, TYPES_STAGE, TypeStage } from '../../../core/services/models/stage.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { DeclarationsStageService } from '../../../core/services/stages/declarations';
import { BoutonRetour } from '../../../shared/bouton-retour/bouton-retour';
import { focaliserPremiereErreur } from '../../../shared/formulaires/focus-premiere-erreur';

const VIERGE = {
  organisme: '', typeStage: '' as TypeStage | '', sujet: '', lieu: '', dateDebut: '', dateFin: '',
  tuteurNom: '', tuteurFonction: '', tuteurEmail: '', tuteurTelephone: '',
};

function texte(valeur: string): string | null {
  return valeur.trim() || null;
}

/**
 * Déclaration d’un stage trouvé hors offre (STA-10). L’organisme est retrouvé parmi ceux de la plateforme, ou nommé
 * librement : l’administrateur Stages l’enregistrera en validant. Le stage est confirmé après cette validation.
 */
@Component({
  selector: 'app-declarer-stage',
  imports: [FormField, RouterLink, BoutonRetour],
  templateUrl: './declarer-stage.html',
  styleUrls: ['../formulaire-offre/formulaire-offre.scss', './declarer-stage.scss'],
})
export class DeclarerStage {
  private readonly service = inject(DeclarationsStageService);
  private readonly organismeService = inject(OrganismeService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly resultat = viewChild<ElementRef<HTMLElement>>('resultat');

  protected readonly types = TYPES_STAGE;
  protected readonly libellesType = LIBELLES_TYPE_STAGE;
  protected readonly modele = signal({ ...VIERGE });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.organisme, { message: 'Indiquez l’organisme qui vous accueille.' });
    maxLength(champ.organisme, 150, { message: '150 caractères au maximum.' });
    required(champ.typeStage, { message: 'Choisissez le type de stage.' });
    required(champ.sujet, { message: 'Le sujet est obligatoire.' });
    maxLength(champ.sujet, 150, { message: '150 caractères au maximum.' });
    maxLength(champ.lieu, 150, { message: '150 caractères au maximum.' });
    required(champ.dateDebut, { message: 'La date de début est obligatoire.' });
    required(champ.dateFin, { message: 'La date de fin est obligatoire.' });
    validate(champ.dateFin, ({ value, valueOf }) => value() && valueOf(champ.dateDebut) && value() < valueOf(champ.dateDebut)
      ? { kind: 'avant', message: 'La fin du stage ne peut pas précéder son début.' } : undefined);
    required(champ.tuteurNom, { message: 'Le nom du maître de stage est obligatoire.' });
    maxLength(champ.tuteurNom, 150, { message: '150 caractères au maximum.' });
    maxLength(champ.tuteurFonction, 150, { message: '150 caractères au maximum.' });
    email(champ.tuteurEmail, { message: 'Cette adresse e-mail n’est pas valide.' });
    maxLength(champ.tuteurTelephone, 30, { message: '30 caractères au maximum.' });
  });

  /** Organismes connus dont le nom ressemble à la saisie. */
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.modele().organisme.trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  protected readonly enCours = signal(false);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly declaree = signal<Declaration | null>(null);

  constructor() {
    toObservable(this.modele).pipe(
      map(({ organisme }) => organisme.trim()),
      distinctUntilChanged(),
      debounceTime(250),
      switchMap((saisie) => saisie.length < 2 ? of([]) : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  protected envoyer(evenement: Event): void {
    evenement.preventDefault();
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      focaliserPremiereErreur(this.hote.nativeElement, this.injector);
      return;
    }
    const saisie = this.modele();
    const connu = this.organismeConnu();
    this.enCours.set(true);
    this.messageErreur.set(null);
    this.service.declarer({
      organismeId: connu?.id ?? null, nomOrganisme: connu ? null : saisie.organisme.trim(),
      typeStage: saisie.typeStage as TypeStage, sujet: saisie.sujet.trim(), lieu: texte(saisie.lieu),
      dateDebut: saisie.dateDebut, dateFin: saisie.dateFin, tuteurNom: saisie.tuteurNom.trim(),
      tuteurFonction: texte(saisie.tuteurFonction), tuteurEmail: texte(saisie.tuteurEmail), tuteurTelephone: texte(saisie.tuteurTelephone),
    }).subscribe({
      next: (declaration) => {
        this.enCours.set(false);
        this.declaree.set(declaration);
        afterNextRender(() => this.resultat()?.nativeElement.focus(), { injector: this.injector });
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.messageErreur.set(erreur.error?.message ?? 'La déclaration n’a pas pu être envoyée. Réessayez.');
      },
    });
  }
}
