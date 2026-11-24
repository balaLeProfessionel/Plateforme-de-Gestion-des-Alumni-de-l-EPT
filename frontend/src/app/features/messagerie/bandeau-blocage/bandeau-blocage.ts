import { afterNextRender, Component, effect, ElementRef, inject, Injector, input, model, output, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { EtatEcriture, MembreConversation } from '../../../core/services/models/messagerie.model';
import { messageServeur } from '../message-erreur';

/**
 * Bas du fil d’une conversation directe fermée ou en passe de l’être : confirmation du blocage, rappel
 * « vous avez bloqué » avec le bouton pour débloquer, ou simple avis pour la personne bloquée (sans le lui dire).
 */
@Component({
  selector: 'app-bandeau-blocage',
  template: `
    @if (confirmer()) {
      <div #confirmation class="bandeau" role="group" aria-labelledby="question-blocage" tabindex="-1">
        <p id="question-blocage">
          <strong>Bloquer {{ interlocuteur().nomAffiche }} ?</strong>
          Vous ne pourrez plus vous écrire dans cette conversation. Cette personne n’en sera pas prévenue ;
          vos groupes communs ne changent pas.
        </p>
        <div class="actions">
          <button type="button" class="danger" [disabled]="enCours()" (click)="bloquer()">Bloquer</button>
          <button type="button" class="secondaire" [disabled]="enCours()" (click)="annuler()">Annuler</button>
        </div>
      </div>
    } @else if (ecriture() === 'J_AI_BLOQUE') {
      <div class="bandeau">
        <p><i class="pi pi-ban" aria-hidden="true"></i>
          Vous avez bloqué {{ interlocuteur().nomAffiche }}. Débloquez cette personne pour vous écrire à nouveau.</p>
        <div class="actions">
          <button type="button" class="secondaire" [disabled]="enCours()" (click)="debloquer()">Débloquer</button>
        </div>
      </div>
    } @else if (ecriture() === 'FERMEE') {
      <div class="bandeau" tabindex="-1">
        <p><i class="pi pi-lock" aria-hidden="true"></i> Vous ne pouvez plus écrire dans cette conversation.</p>
      </div>
    }
    @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
  `,
  styles: `
    :host { display: block; border-top: 1px solid var(--ept-border); background: var(--ept-surface); }
    :host:empty { display: none; }
    .bandeau {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
    }
    .bandeau:focus { outline: none; }
    p { min-width: 0; flex: 1 1 16rem; margin: 0; color: var(--ept-text-secondary); font-size: 0.9rem; line-height: 1.5; }
    strong { color: var(--ept-text); }
    i { margin-right: 0.35rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    button {
      min-height: 2.75rem;
      padding: 0 1.1rem;
      border-radius: var(--ept-radius-sm);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:focus-visible { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; }
    button:disabled { cursor: not-allowed; opacity: 0.55; }
    .secondaire { border: 1px solid var(--ept-primary); background: var(--ept-surface); color: var(--ept-primary); }
    .secondaire:hover:not(:disabled) { background: var(--ept-primary-light); }
    .danger { border: 1px solid var(--ept-error); background: var(--ept-surface); color: var(--ept-error-dark); }
    .danger:hover:not(:disabled) { background: var(--ept-error-light); }
    .erreur { margin: 0; padding: 0 1rem 0.75rem; color: var(--ept-error-dark); font-size: 0.85rem; }
  `,
})
export class BandeauBlocage {
  private readonly messagerie = inject(MessagerieService);
  private readonly injector = inject(Injector);
  private readonly confirmation = viewChild<ElementRef<HTMLElement>>('confirmation');
  readonly interlocuteur = input.required<MembreConversation>();
  readonly ecriture = input.required<EtatEcriture>();
  /** Ouvert par le bouton « Bloquer » de l’en-tête. */
  readonly confirmer = model(false);
  /** Le blocage a changé : le fil recharge le détail de la conversation. */
  readonly modifie = output<void>();
  readonly annule = output<void>();

  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  constructor() {
    // La question reçoit le focus : elle est lue, et Tab mène à ses boutons.
    effect(() => {
      if (this.confirmer()) afterNextRender(() => this.confirmation()?.nativeElement.focus(), { injector: this.injector });
    });
  }

  protected annuler(): void {
    this.confirmer.set(false);
    this.annule.emit();
  }

  protected async bloquer(): Promise<void> {
    if (await this.executer(() => this.messagerie.bloquer(this.interlocuteur().id))) this.confirmer.set(false);
  }

  protected debloquer(): Promise<boolean> {
    return this.executer(() => this.messagerie.debloquer(this.interlocuteur().id));
  }

  private async executer(appel: () => ReturnType<MessagerieService['bloquer']>): Promise<boolean> {
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      await firstValueFrom(appel(), { defaultValue: undefined });
      this.modifie.emit();
      return true;
    } catch (erreur) {
      this.erreur.set(messageServeur(erreur, 'L’opération a échoué. Réessayez.'));
      return false;
    } finally {
      this.enCours.set(false);
    }
  }
}
