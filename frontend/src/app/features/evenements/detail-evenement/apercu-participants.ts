import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EvenementService } from '../../../core/services/evenements/evenement';
import { PageParticipants } from '../../../core/services/models/evenement';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { DialogueParticipants } from './dialogue-participants';

/** Avatars montrés dans la pile ; au-delà, une pastille « +N ». */
const TAILLE_PILE = 5;

/**
 * Aperçu des inscrits dans la carte de réponse : une pile d’avatars, une phrase avec les premiers
 * prénoms (« Ndeye, Mamadou et 3 autres participent ») et la liste complète dans une fenêtre.
 * Les membres ne voient que les profils visibles dans l’annuaire ; l’organisateur voit tout le monde.
 */
@Component({
  selector: 'app-apercu-participants',
  imports: [AvatarMembre, DialogueParticipants],
  template: `
    @if (apercu(); as page) {
      @if (page.totalElements > 0) {
        <div class="apercu-participants">
          <!-- La phrase dit qui participe ; la pile n’est qu’illustrative. -->
          <ul class="pile" aria-hidden="true">
            @for (participant of page.contenu; track participant.id) {
              <li><app-avatar-membre [urlPhoto]="participant.urlPhoto" [prenom]="participant.prenom"
                [nom]="participant.nom" [roleMembre]="participant.role" [taille]="2.25" /></li>
            }
            @if (reste() > 0) { <li class="reste">+{{ reste() }}</li> }
          </ul>
          <button type="button" class="voir" aria-haspopup="dialog" (click)="ouverte.set(true)">Voir la liste</button>
          <p class="phrase">{{ phrase() }}</p>
        </div>
      }
    }
    @if (masqueeAuxMembres()) {
      <p class="note-masquee"><i class="pi pi-eye-slash" aria-hidden="true"></i> Liste masquée aux membres : vous seul la voyez.</p>
    }
    <app-dialogue-participants [evenementId]="evenementId()" [ouverte]="ouverte()"
      [masqueeAuxMembres]="masqueeAuxMembres()" (fermee)="ouverte.set(false)" />
  `,
  styles: `
    :host { display: grid; gap: .5rem; }
    .apercu-participants { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'pile voir' 'phrase phrase';
      align-items: center; gap: .45rem .75rem; }
    .pile { grid-area: pile; display: flex; margin: 0; padding: 0; list-style: none; }
    .pile li { display: inline-flex; border-radius: 50%; box-shadow: 0 0 0 2px white; }
    .pile li + li { margin-left: -.6rem; }
    .reste { width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; background: #e7f4f8;
      color: var(--ept-primary); font-size: .75rem; font-weight: 700; }
    .phrase { grid-area: phrase; margin: 0; color: var(--ept-text-secondary); font-size: .88rem; line-height: 1.4; }
    .voir { grid-area: voir; min-height: 2.75rem; padding: .4rem .25rem; border: 0; background: none; color: var(--ept-primary);
      font: inherit; font-size: .88rem; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
    .voir:hover { color: var(--ept-primary-dark); }
    .voir:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; border-radius: var(--ept-radius-sm); }
    .note-masquee { display: flex; align-items: center; gap: .45rem; margin: 0; color: var(--ept-text-secondary); font-size: .82rem; }
  `,
})
export class ApercuParticipants {
  readonly evenementId = input.required<string>();
  /** Nombre annoncé par la fiche ; quand il change (après une réponse), l’aperçu se recharge. */
  readonly nombre = input.required<number>();
  readonly masqueeAuxMembres = input(false);

  private readonly evenementService = inject(EvenementService);
  protected readonly apercu = signal<PageParticipants | null>(null);
  protected readonly ouverte = signal(false);

  protected readonly reste = computed(() => {
    const page = this.apercu();
    return page ? page.totalElements - page.contenu.length : 0;
  });

  protected readonly phrase = computed(() => {
    const page = this.apercu();
    if (!page) return '';
    const prenoms = page.contenu.slice(0, 2).map((participant) => participant.prenom || participant.nom);
    const autres = page.totalElements - prenoms.length;
    if (page.totalElements === 1) return `${prenoms[0]} participe`;
    if (autres === 0) return `${prenoms[0]} et ${prenoms[1]} participent`;
    return `${prenoms.join(', ')} et ${autres} ${autres === 1 ? 'autre' : 'autres'} participent`;
  });

  constructor() {
    effect(() => {
      const id = this.evenementId();
      this.nombre();
      untracked(() => void this.charger(id));
    });
  }

  private async charger(id: string): Promise<void> {
    try {
      this.apercu.set(await firstValueFrom(this.evenementService.listerParticipants(id, 0, TAILLE_PILE)));
    } catch {
      // Aperçu secondaire : en cas d’échec, la carte garde le nombre de participants.
      this.apercu.set(null);
    }
  }
}
