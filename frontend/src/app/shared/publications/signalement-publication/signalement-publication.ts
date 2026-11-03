import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, effect, ElementRef, inject, input, model, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { MOTIFS_SIGNALEMENT, MotifSignalement, PublicationService } from '../../../core/services/publications/publication';

/**
 * Fenêtre de signalement : un motif, une précision (obligatoire pour « Autre »), un seul envoi.
 * Le parent l’ouvre avec `ouvert`, reçoit `transmis` (message de confirmation) et `ferme` pour rendre le focus.
 */
@Component({
  selector: 'app-signalement-publication',
  imports: [FormField],
  template: `
    @if (ouvert()) {
      <dialog #dialogue class="dialogue" [attr.aria-labelledby]="'titre-signalement-' + publicationId()"
        [attr.aria-describedby]="'aide-signalement-' + publicationId()" (cancel)="fermer()">
        <form (submit)="envoyer($event)" novalidate>
          <header class="entete">
            <span class="icone" aria-hidden="true"><i class="pi pi-flag"></i></span>
            <div>
              <h2 [id]="'titre-signalement-' + publicationId()">Signaler cette publication</h2>
              <p class="aide" [id]="'aide-signalement-' + publicationId()">L’administration examine chaque signalement.
                L’auteur ne sait pas qui l’a signalé.</p>
            </div>
            <button type="button" class="fermer" [disabled]="envoi()" (click)="fermer()" aria-label="Fermer">
              <i class="pi pi-times" aria-hidden="true"></i>
            </button>
          </header>

          <fieldset [attr.aria-describedby]="erreurMotif() ? 'erreur-motif-' + publicationId() : null">
            <legend>Pour quelle raison ?</legend>
            @for (option of motifs; track option.motif) {
              <label class="option" [class.choisie]="modele().motif === option.motif">
                <input type="radio" [name]="'motif-' + publicationId()" [value]="option.motif"
                  [checked]="modele().motif === option.motif" (change)="choisir(option.motif)" />
                <span>{{ option.libelle }}</span>
              </label>
            }
          </fieldset>
          @if (erreurMotif()) {
            <p class="erreur" [id]="'erreur-motif-' + publicationId()"><i class="pi pi-exclamation-circle" aria-hidden="true"></i> {{ erreurMotif() }}</p>
          }

          <div class="precisions">
            <label [for]="'detail-signalement-' + publicationId()">
              Précisions <span>{{ modele().motif === 'AUTRE' ? 'obligatoire' : 'facultatif' }}</span>
            </label>
            <textarea [id]="'detail-signalement-' + publicationId()" rows="3" [formField]="formulaire.detail"
              placeholder="Ce qui pose problème dans cette publication…"
              [attr.aria-invalid]="formulaire.detail().touched() && formulaire.detail().invalid()"
              [attr.aria-describedby]="'compteur-signalement-' + publicationId() + (formulaire.detail().touched() && formulaire.detail().invalid() ? ' erreur-detail-' + publicationId() : '')"></textarea>
            <p class="compteur" [id]="'compteur-signalement-' + publicationId()" [class.depasse]="modele().detail.length > 500">
              {{ modele().detail.length }} / 500</p>
            @if (formulaire.detail().touched() && formulaire.detail().errors()[0]; as erreurDetail) {
              <p class="erreur" [id]="'erreur-detail-' + publicationId()"><i class="pi pi-exclamation-circle" aria-hidden="true"></i> {{ erreurDetail.message }}</p>
            }
          </div>

          @if (erreur()) { <p class="erreur" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i> {{ erreur() }}</p> }
          <div class="actions">
            <button type="button" class="annuler" [disabled]="envoi()" (click)="fermer()">Annuler</button>
            <button type="submit" class="envoyer" [disabled]="envoi()">
              <i class="pi" [class.pi-send]="!envoi()" [class.pi-spinner]="envoi()" [class.pi-spin]="envoi()" aria-hidden="true"></i>
              {{ envoi() ? 'Envoi…' : 'Signaler' }}
            </button>
          </div>
        </form>
      </dialog>
    }
  `,
  styles: `
    :host { display: contents; }
    button { font: inherit; cursor: pointer; }
    button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .dialogue { box-sizing: border-box; width: min(28rem, calc(100vw - 2rem)); max-height: calc(100dvh - 2rem);
      margin: auto; padding: 1.25rem; overflow-y: auto; border: 0; border-radius: var(--ept-radius-lg); background: var(--ept-surface);
      color: var(--ept-primary-dark); box-shadow: 0 24px 60px -20px rgb(1 40 60 / 45%); }
    .dialogue::backdrop { background: rgb(11 37 51 / 55%); }
    .entete { display: flex; align-items: flex-start; gap: .8rem; }
    .entete > div { flex: 1 1 auto; min-width: 0; }
    .icone { display: grid; flex: 0 0 auto; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%;
      background: var(--ept-error-light); color: var(--ept-error-dark); }
    h2 { margin: .1rem 0 0; font-family: var(--ept-font-heading); font-size: 1.15rem; font-weight: 600; line-height: 1.3; }
    .aide { margin: .3rem 0 0; color: var(--ept-text-secondary); font-size: .88rem; line-height: 1.45; }
    .fermer { display: grid; flex: 0 0 auto; place-items: center; width: 2.25rem; height: 2.25rem; margin: -.35rem -.4rem 0 0;
      padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--ept-text-secondary); }
    .fermer:hover { background: var(--ept-bg); color: var(--ept-primary); }
    fieldset { display: grid; gap: .45rem; margin: 1.15rem 0 0; padding: 0; border: 0; }
    legend { margin-bottom: .55rem; padding: 0; font-weight: 600; font-size: .95rem; }
    .option { display: flex; align-items: center; gap: .7rem; min-height: 2.75rem; box-sizing: border-box; padding: .5rem .85rem;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius); cursor: pointer; transition: border-color .15s, background-color .15s; }
    .option:hover { border-color: #a9c3d1; background: var(--ept-bg); }
    .option.choisie { border-color: var(--ept-primary); background: var(--ept-primary-light); font-weight: 600; }
    .option:has(input:focus-visible) { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .option input { width: 1.1rem; height: 1.1rem; margin: 0; flex: 0 0 auto; accent-color: var(--ept-primary); }
    .option input:focus-visible { outline: none; }
    .precisions { margin-top: 1.1rem; }
    .precisions label { display: block; margin-bottom: .4rem; font-weight: 600; font-size: .95rem; }
    .precisions label span { margin-left: .35rem; color: var(--ept-text-secondary); font-size: .8rem; font-weight: 400; }
    textarea { display: block; box-sizing: border-box; width: 100%; min-height: 5.5rem; resize: vertical; padding: .65rem .8rem;
      border: 1px solid var(--ept-border); border-radius: var(--ept-radius); background: var(--ept-bg); color: inherit; font: inherit; }
    textarea:focus { border-color: var(--ept-primary); background: var(--ept-surface); }
    textarea[aria-invalid='true'] { border-color: var(--ept-error); }
    .compteur { margin: .3rem .2rem 0 0; color: var(--ept-text-secondary); font-size: .78rem; text-align: right; }
    .compteur.depasse { color: var(--ept-error-dark); font-weight: 600; }
    .erreur { display: flex; align-items: center; gap: .4rem; margin: .45rem 0 0; color: var(--ept-error-dark); font-size: .88rem; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: 1.25rem; }
    .actions button { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 2.75rem;
      padding: .55rem 1rem; border-radius: var(--ept-radius-sm); font-weight: 600; }
    .annuler { border: 1px solid var(--ept-border); background: var(--ept-surface); color: var(--ept-primary); }
    .annuler:hover { background: var(--ept-bg); }
    .envoyer { border: 1px solid var(--ept-primary); background: var(--ept-primary); color: white; }
    .envoyer:hover { background: var(--ept-primary-dark); }
    .actions button:disabled { opacity: .65; cursor: progress; }
    @media (prefers-reduced-motion: reduce) { .option { transition: none; } }
  `,
})
export class SignalementPublication {
  readonly publicationId = input.required<string>();
  protected readonly motifs = MOTIFS_SIGNALEMENT;
  readonly ouvert = model(false);
  readonly transmis = output<string>();
  readonly ferme = output<void>();
  protected readonly envoi = signal(false);
  protected readonly erreur = signal('');
  protected readonly erreurMotif = signal('');
  protected readonly modele = signal({ motif: '' as MotifSignalement | '', detail: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.detail, { message: 'Précisez la raison du signalement.', when: () => this.modele().motif === 'AUTRE' });
    maxLength(champ.detail, 500, { message: '500 caractères maximum.' });
  });
  private readonly dialogue = viewChild<ElementRef<HTMLDialogElement>>('dialogue');
  private readonly service = inject(PublicationService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      const dialogue = this.dialogue()?.nativeElement;
      if (dialogue && !dialogue.open) dialogue.showModal();
    });
  }

  protected choisir(motif: MotifSignalement): void {
    this.modele.update((valeurs) => ({ ...valeurs, motif }));
    this.erreurMotif.set('');
  }

  protected fermer(): void {
    if (this.envoi()) return;
    this.dialogue()?.nativeElement.close();
    this.ouvert.set(false);
    this.erreur.set('');
    this.erreurMotif.set('');
    this.modele.set({ motif: '', detail: '' });
    this.formulaire().reset();
    this.ferme.emit();
  }

  protected envoyer(event: Event): void {
    event.preventDefault();
    if (this.envoi()) return;
    const { motif, detail } = this.modele();
    this.formulaire.detail().markAsTouched();
    if (!motif) this.erreurMotif.set('Choisissez une raison.');
    if (!motif || this.formulaire().invalid()) return;
    this.envoi.set(true);
    this.erreur.set('');
    this.service.signaler(this.publicationId(), motif, detail.trim())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.terminer('Merci, votre signalement a été transmis à l’administration.'),
        error: (erreur: HttpErrorResponse) => {
          if (erreur.status === 409) {
            this.terminer('Vous avez déjà signalé cette publication.');
            return;
          }
          this.erreur.set(erreur.status === 404 ? 'Cette publication n’est plus disponible.'
            : typeof erreur.error?.message === 'string' && erreur.status === 400 ? erreur.error.message
            : 'Le signalement n’a pas pu être envoyé. Réessayez.');
          this.envoi.set(false);
        },
      });
  }

  private terminer(message: string): void {
    this.envoi.set(false);
    this.dialogue()?.nativeElement.close();
    this.ouvert.set(false);
    this.modele.set({ motif: '', detail: '' });
    this.formulaire().reset();
    this.transmis.emit(message);
    this.ferme.emit();
  }
}
