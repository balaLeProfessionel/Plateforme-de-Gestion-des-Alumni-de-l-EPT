import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EvenementService } from '../../../core/services/evenements/evenement';
import { PageParticipants } from '../../../core/services/models/evenement';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

const LIBELLES_ROLE: Record<string, string> = { ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel', VISITEUR: 'Visiteur' };

/**
 * Liste paginée des participants inscrits, réservée à l’organisateur et à l’administration.
 * Elle se recharge quand le nombre de participants change (après une réponse).
 */
@Component({
  selector: 'app-participants-evenement',
  imports: [AvatarMembre],
  template: `
    <section class="liste-participants" aria-labelledby="titre-participants">
      <div class="entete-participants">
        <h2 id="titre-participants">Participants inscrits</h2>
        <span>{{ nombre() }} {{ nombre() === 1 ? 'personne' : 'personnes' }}</span>
      </div>
      @if (chargement()) {
        <p class="etat-participants" aria-live="polite">Chargement des participants…</p>
      } @else if (erreur()) {
        <div class="etat-participants erreur" role="alert">
          <p>{{ erreur() }}</p>
          <button type="button" (click)="charger(0)">Réessayer</button>
        </div>
      } @else if (participants(); as resultat) {
        @if (resultat.contenu.length === 0) {
          <p class="etat-participants">Aucune participation confirmée pour le moment.</p>
        } @else {
          <ul class="grille-participants">
            @for (participant of resultat.contenu; track participant.id) {
              <li>
                <app-avatar-membre [urlPhoto]="participant.urlPhoto" [prenom]="participant.prenom" [nom]="participant.nom"
                  [roleMembre]="participant.role" [taille]="2.5" />
                <span class="identite"><strong>{{ participant.prenom }} {{ participant.nom }}</strong>
                  <small>{{ libelleRole(participant.role) }}</small></span>
              </li>
            }
          </ul>
          @if (resultat.totalPages > 1) {
            <nav class="pagination" aria-label="Pagination des participants">
              <button type="button" (click)="charger(resultat.page - 1)" [disabled]="resultat.page === 0"
                aria-label="Page précédente"><i class="pi pi-chevron-left" aria-hidden="true"></i></button>
              @for (numero of pages(); track numero) {
                @if (numero === resultat.page - 1 && numero > 0) { <span aria-hidden="true">…</span> }
                <button type="button" (click)="charger(numero)" [class.page-active]="numero === resultat.page"
                  [attr.aria-current]="numero === resultat.page ? 'page' : null"
                  [attr.aria-label]="'Page ' + (numero + 1)">{{ numero + 1 }}</button>
                @if (numero === resultat.page + 1 && numero < resultat.totalPages - 1) { <span aria-hidden="true">…</span> }
              }
              <button type="button" (click)="charger(resultat.page + 1)" [disabled]="resultat.page + 1 >= resultat.totalPages"
                aria-label="Page suivante"><i class="pi pi-chevron-right" aria-hidden="true"></i></button>
            </nav>
          }
        }
      }
    </section>
  `,
  styles: `
    .liste-participants { padding: 1.25rem 1.5rem; }
    .entete-participants { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; margin-bottom: .9rem; }
    h2 { margin: 0; color: var(--ept-primary-dark); font-size: 1.2rem; }
    .entete-participants span { color: var(--ept-text-secondary); font-size: .88rem; }
    .grille-participants { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr)); gap: .6rem;
      margin: 0; padding: 0; list-style: none; }
    li { display: flex; align-items: center; gap: .6rem; min-width: 0; padding: .55rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius-sm); }
    .identite { display: grid; min-width: 0; }
    .identite strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    small { color: var(--ept-text-secondary); }
    .etat-participants { margin: 0; padding: 1rem; border: 1px dashed var(--ept-border); border-radius: var(--ept-radius-sm);
      color: var(--ept-text-secondary); text-align: center; }
    .etat-participants p { margin: 0; }
    .etat-participants.erreur { color: var(--ept-error-dark); }
    button { min-width: 2.75rem; min-height: 2.75rem; padding: .5rem .75rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius-sm); background: white; color: var(--ept-primary); font: inherit; font-weight: 700; cursor: pointer; }
    .etat-participants button { margin-top: .6rem; border-color: var(--ept-primary); background: var(--ept-primary); color: white; }
    button:disabled { opacity: .5; cursor: not-allowed; }
    button:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
    .pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .4rem; margin-top: .8rem; }
    .page-active { border-color: var(--ept-primary); background: var(--ept-primary); color: white; }
  `,
})
export class ParticipantsEvenement {
  readonly evenementId = input.required<string>();
  /** Nombre de participants annoncé par la fiche ; quand il change, la liste se recharge. */
  readonly nombre = input.required<number>();

  private readonly evenementService = inject(EvenementService);
  protected readonly participants = signal<PageParticipants | null>(null);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.evenementId();
      this.nombre();
      untracked(() => void this.charger(0));
    });
  }

  protected async charger(page: number): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      this.participants.set(await firstValueFrom(this.evenementService.listerParticipants(this.evenementId(), page)));
    } catch (erreur) {
      this.erreur.set(erreur instanceof HttpErrorResponse && erreur.status === 404
        ? 'La liste des participants n’est pas disponible pour ce compte.'
        : 'Impossible de charger la liste des participants.');
    } finally {
      this.chargement.set(false);
    }
  }

  protected libelleRole(role: string): string {
    return LIBELLES_ROLE[role] ?? 'Membre';
  }

  protected pages(): number[] {
    const total = this.participants()?.totalPages ?? 0;
    if (total <= 5) return Array.from({ length: total }, (_, index) => index);
    const courant = this.participants()?.page ?? 0;
    const debut = Math.max(0, Math.min(courant - 1, total - 3));
    const visibles = Array.from({ length: 3 }, (_, index) => debut + index);
    return [...new Set([0, ...visibles, total - 1])].sort((a, b) => a - b);
  }
}
