import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, ElementRef, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { form, FormField, maxLength } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { EvenementService } from '../../../core/services/evenements/evenement';
import { ParticipantEvenement } from '../../../core/services/models/evenement';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

const LIBELLES_ROLE: Record<string, string> = {
  ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel', VISITEUR: 'Visiteur', ORGANISME: 'Organisme',
};
const TAILLE_LOT = 12;
/** À partir de ce nombre d’inscrits, la fenêtre propose de chercher un nom. */
const SEUIL_RECHERCHE = 10;
const DELAI_SAISIE_MS = 300;

/**
 * Liste complète des inscrits dans une fenêtre modale native (piège du focus, Échap et retour du focus
 * gérés par le navigateur) : une seule liste qui défile, complétée par « Afficher plus »,
 * et une recherche par nom quand les inscrits sont nombreux.
 */
@Component({
  selector: 'app-dialogue-participants',
  imports: [AvatarMembre, FormField],
  template: `
    <dialog #dialogue aria-labelledby="titre-dialogue-participants" (close)="fermee.emit()">
      <header>
        <h2 id="titre-dialogue-participants">Participants inscrits
          @if (totalSansFiltre() !== null) { <span class="total">{{ totalSansFiltre() }}</span> }
        </h2>
        <button type="button" class="fermer" (click)="dialogue.close()" aria-label="Fermer la liste des participants">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </header>
      @if (masqueeAuxMembres()) {
        <p class="note-masquee"><i class="pi pi-eye-slash" aria-hidden="true"></i>
          Liste masquée aux membres : vous seul la voyez. Modifiez l’événement pour la rendre visible.</p>
      }
      @if (rechercheProposee()) {
        <div class="recherche" role="search">
          <label for="recherche-participants" class="cache">Rechercher un participant</label>
          <i class="pi pi-search" aria-hidden="true"></i>
          <input id="recherche-participants" type="search" placeholder="Rechercher un participant" autocomplete="off"
            [formField]="formulaire.recherche" (keydown.enter)="appliquerRecherche($event)" />
        </div>
      }
      <div class="contenu" [attr.aria-busy]="chargement()">
        <p class="cache" role="status">{{ annonce() }}</p>
        @if (erreur()) {
          <div class="etat erreur" role="alert">
            <p>{{ erreur() }}</p>
            <button type="button" class="reessayer" (click)="charger(0)">Réessayer</button>
          </div>
        } @else if (premierChargement()) {
          <p class="etat">Chargement des participants…</p>
        } @else if (participants().length === 0) {
          <p class="etat">
            @if (rechercheAppliquee()) { Aucun participant ne correspond à « {{ rechercheAppliquee() }} ». }
            @else { Aucune participation confirmée pour le moment. }
          </p>
        } @else {
          <ul class="liste" [class.attenuee]="chargement() && pageCourante() === 0">
            @for (participant of participants(); track participant.id) {
              <li>
                <app-avatar-membre [urlPhoto]="participant.urlPhoto" [prenom]="participant.prenom" [nom]="participant.nom"
                  [roleMembre]="participant.role" [taille]="2.1" />
                <span class="identite"><strong>{{ participant.prenom }} {{ participant.nom }}</strong>
                  <small>{{ libelleRole(participant.role) }}</small></span>
              </li>
            }
          </ul>
          @if (restants() > 0) {
            <button type="button" class="plus" [disabled]="chargement()" (click)="charger(pageCourante() + 1)">
              {{ chargement() ? 'Chargement…' : 'Afficher plus (' + restants() + ')' }}
            </button>
          }
        }
      </div>
    </dialog>
  `,
  styles: `
    dialog { width: min(100% - 2rem, 32rem); height: min(85vh, 40rem); padding: 0; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius); background: white; color: inherit; box-shadow: 0 24px 60px rgb(1 67 101 / 22%); }
    dialog[open] { display: flex; flex-direction: column; }
    dialog::backdrop { background: rgb(1 30 46 / 45%); }
    header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .85rem 1.25rem;
      border-bottom: 1px solid var(--ept-border); }
    h2 { display: flex; align-items: center; gap: .5rem; margin: 0; color: var(--ept-primary-dark); font-size: 1.1rem; }
    .total { padding: .1rem .5rem; border-radius: 999px; background: #e7f4f8; color: var(--ept-primary); font-size: .8rem; }
    .note-masquee { display: flex; align-items: center; gap: .5rem; margin: 0; padding: .65rem 1.25rem; background: #f5f7f8;
      color: var(--ept-text-secondary); font-size: .85rem; }
    .recherche { position: relative; padding: .75rem 1.25rem 0; }
    .recherche i { position: absolute; top: calc(.75rem + 1.375rem); left: 2.05rem; transform: translateY(-50%);
      color: var(--ept-text-secondary); font-size: .85rem; }
    input { box-sizing: border-box; width: 100%; min-height: 2.75rem; padding: .5rem .75rem .5rem 2.2rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius-sm); font: inherit; font-size: .92rem; }
    input:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 1px; border-color: var(--ept-primary); }
    .contenu { flex: 1; overflow-y: auto; padding: .35rem 1.25rem 1rem; }
    .liste { display: grid; margin: 0; padding: 0; list-style: none; transition: opacity .15s; }
    .liste.attenuee { opacity: .55; }
    li { display: flex; align-items: center; gap: .7rem; min-width: 0; padding: .4rem 0; }
    li + li { border-top: 1px solid var(--ept-border); }
    .identite { display: grid; min-width: 0; line-height: 1.3; }
    strong { overflow: hidden; color: var(--ept-primary-dark); font-size: .92rem; text-overflow: ellipsis; white-space: nowrap; }
    small { color: var(--ept-text-secondary); font-size: .8rem; }
    .etat { margin: 1rem 0 0; color: var(--ept-text-secondary); text-align: center; }
    .etat p { margin: 0; }
    .erreur { color: var(--ept-error-dark); }
    button { display: inline-flex; align-items: center; justify-content: center; gap: .35rem; min-width: 2.75rem; min-height: 2.75rem;
      padding: .45rem .75rem; border: 1px solid var(--ept-border); border-radius: var(--ept-radius-sm); background: white;
      color: var(--ept-primary); font: inherit; font-size: .88rem; font-weight: 700; cursor: pointer; }
    .fermer { border-color: transparent; }
    .fermer:hover, .plus:hover:not(:disabled) { background: #f2f8fb; }
    .plus { width: 100%; margin-top: .6rem; }
    .reessayer { margin-top: .6rem; border-color: var(--ept-primary); background: var(--ept-primary); color: white; }
    button:disabled { opacity: .55; cursor: not-allowed; }
    button:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  `,
})
export class DialogueParticipants {
  readonly evenementId = input.required<string>();
  readonly ouverte = input(false);
  /** Vue de l’organisateur quand la liste est cachée aux membres : on le lui rappelle. */
  readonly masqueeAuxMembres = input(false);
  readonly fermee = output<void>();

  private readonly evenementService = inject(EvenementService);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');

  protected readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.recherche, 100);
  });
  protected readonly rechercheAppliquee = signal('');
  protected readonly participants = signal<readonly ParticipantEvenement[]>([]);
  /** Nombre d’inscrits correspondant à la recherche en cours. */
  private readonly totalFiltre = signal(0);
  /** Nombre d’inscrits sans recherche : en-tête et seuil de la recherche. */
  protected readonly totalSansFiltre = signal<number | null>(null);
  protected readonly pageCourante = signal(0);
  protected readonly chargement = signal(false);
  protected readonly premierChargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly annonce = signal('');
  private numeroRequete = 0;
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  protected readonly restants = computed(() => this.totalFiltre() - this.participants().length);
  protected readonly rechercheProposee = computed(() =>
    (this.totalSansFiltre() ?? 0) >= SEUIL_RECHERCHE || this.rechercheAppliquee() !== '');

  constructor() {
    effect(() => {
      const ouverte = this.ouverte();
      const dialogue = this.dialogue().nativeElement;
      if (ouverte) {
        // jsdom n’implémente pas showModal : la fenêtre reste alors fermée dans les tests.
        if (!dialogue.open && typeof dialogue.showModal === 'function') dialogue.showModal();
        untracked(() => {
          this.modele.set({ recherche: '' });
          this.rechercheAppliquee.set('');
          this.premierChargement.set(true);
          void this.charger(0);
        });
      } else if (dialogue.open) {
        dialogue.close();
      }
    });

    // La saisie s’applique après une courte pause ; Entrée l’applique tout de suite.
    effect(() => {
      const saisie = this.modele().recherche.trim();
      clearTimeout(this.minuterie);
      if (saisie === untracked(this.rechercheAppliquee)) return;
      this.minuterie = setTimeout(() => this.lancerRecherche(saisie), DELAI_SAISIE_MS);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
  }

  protected appliquerRecherche(evenement: Event): void {
    evenement.preventDefault();
    clearTimeout(this.minuterie);
    this.lancerRecherche(this.modele().recherche.trim());
  }

  private lancerRecherche(saisie: string): void {
    if (saisie === this.rechercheAppliquee()) return;
    this.rechercheAppliquee.set(saisie);
    void this.charger(0);
  }

  /** Page 0 : remplace la liste ; pages suivantes : complète la liste (« Afficher plus »). */
  protected async charger(page: number): Promise<void> {
    const numero = ++this.numeroRequete;
    const recherche = this.rechercheAppliquee();
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const resultat = await firstValueFrom(
        this.evenementService.listerParticipants(this.evenementId(), page, TAILLE_LOT, recherche));
      if (numero !== this.numeroRequete) return; // une recherche plus récente a pris le relais
      this.participants.update((actuels) => page === 0 ? resultat.contenu : [...actuels, ...resultat.contenu]);
      this.totalFiltre.set(resultat.totalElements);
      this.pageCourante.set(resultat.page);
      if (!recherche) this.totalSansFiltre.set(resultat.totalElements);
      if (recherche) {
        this.annonce.set(`${resultat.totalElements} ${resultat.totalElements === 1 ? 'participant trouvé' : 'participants trouvés'}`);
      } else if (page > 0) {
        this.annonce.set(`${this.participants().length} participants affichés sur ${resultat.totalElements}`);
      }
    } catch (erreur) {
      if (numero !== this.numeroRequete) return;
      this.erreur.set(erreur instanceof HttpErrorResponse && erreur.status === 404
        ? 'La liste des participants n’est pas disponible pour ce compte.'
        : 'Impossible de charger la liste des participants.');
    } finally {
      if (numero === this.numeroRequete) {
        this.chargement.set(false);
        this.premierChargement.set(false);
      }
    }
  }

  protected libelleRole(role: string): string {
    return LIBELLES_ROLE[role] ?? 'Membre';
  }
}
