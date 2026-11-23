import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { MOTIF_LONGUEUR_MAX } from '../../../../core/services/models/admin.model';
import { libelleClasse } from '../../../../core/services/models/classe.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { Declaration, LIBELLES_STATUT_STAGE, LIBELLES_TYPE_STAGE } from '../../../../core/services/models/stage.model';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { DeclarationsStageService } from '../../../../core/services/stages/declarations';
import { AvatarMembre } from '../../../../shared/images/avatar-membre';

type Mode = 'lecture' | 'valider' | 'refuser';

/**
 * Une déclaration de stage (STA-10) vue par l’administrateur Stages. Valider enregistre l’organisme : celui de la
 * plateforme choisi par l’étudiant, ou celui qu’il a nommé, à rattacher à un organisme connu ou à créer.
 */
@Component({
  selector: 'app-carte-declaration',
  imports: [DatePipe, RouterLink, AvatarMembre],
  templateUrl: './carte-declaration.html',
  styleUrls: ['../../formulaire-admin.scss', './carte-declaration.scss'],
})
export class CarteDeclaration {
  private readonly service = inject(DeclarationsStageService);
  private readonly organismeService = inject(OrganismeService);

  readonly declaration = input.required<Declaration>();
  /** La déclaration est traitée : le message dit ce qui a été fait. */
  readonly traitee = output<string>();

  protected readonly types = LIBELLES_TYPE_STAGE;
  protected readonly statuts = LIBELLES_STATUT_STAGE;
  protected readonly libelleClasse = libelleClasse;
  protected readonly longueurMotif = MOTIF_LONGUEUR_MAX;
  protected readonly mode = signal<Mode>('lecture');
  protected readonly organisme = signal('');
  protected readonly motif = signal('');
  protected readonly suggestions = signal<readonly OrganismeSuggestion[]>([]);
  protected readonly erreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected readonly nom = computed(() => `${this.declaration().etudiant.prenom} ${this.declaration().etudiant.nom}`);
  protected readonly organismeConnu = computed(() => {
    const saisie = this.organisme().trim().toLowerCase();
    return this.suggestions().find((s) => s.nom.toLowerCase() === saisie) ?? null;
  });
  private readonly saisies = new Subject<string>();

  constructor() {
    this.saisies.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap((saisie) => saisie.length < 2 ? of([]) : this.organismeService.rechercherOrganismes(saisie).pipe(catchError(() => of([])))),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((liste) => this.suggestions.set(liste));
  }

  protected ouvrir(mode: Mode): void {
    this.erreur.set(null);
    this.motif.set('');
    this.organisme.set(this.declaration().organisme);
    this.saisies.next(this.declaration().organisme.trim());
    this.mode.set(mode);
  }

  protected saisirOrganisme(evenement: Event): void {
    const valeur = (evenement.target as HTMLInputElement).value;
    this.organisme.set(valeur);
    this.saisies.next(valeur.trim());
  }

  protected saisirMotif(evenement: Event): void {
    this.motif.set((evenement.target as HTMLTextAreaElement).value);
  }

  protected valider(): void {
    const d = this.declaration();
    const saisie = this.organisme().trim();
    if (!saisie) {
      this.erreur.set('Indiquez l’organisme d’accueil.');
      return;
    }
    const connu = this.organismeConnu();
    // L’organisme déjà rattaché par l’étudiant et inchangé : rien à préciser au serveur.
    const organisme = d.organismeId && saisie === d.organisme ? {}
      : connu ? { organismeId: connu.id } : { nomNouvelOrganisme: saisie };
    this.executer(this.service.valider(d.id, organisme),
      `Le stage de ${this.nom()} chez ${connu?.nom ?? saisie} est validé. L’étudiant en est prévenu par e-mail.`);
  }

  protected refuser(): void {
    const motif = this.motif().trim();
    if (!motif) {
      this.erreur.set('Le motif est obligatoire : il est envoyé à l’étudiant.');
      return;
    }
    this.executer(this.service.refuser(this.declaration().id, motif),
      `La déclaration de ${this.nom()} est refusée. L’étudiant reçoit le motif par e-mail.`);
  }

  private executer(requete: ReturnType<DeclarationsStageService['refuser']>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    requete.subscribe({
      next: () => {
        this.enCours.set(false);
        this.mode.set('lecture');
        this.traitee.emit(message);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’action a échoué. Réessayez.');
      },
    });
  }
}
