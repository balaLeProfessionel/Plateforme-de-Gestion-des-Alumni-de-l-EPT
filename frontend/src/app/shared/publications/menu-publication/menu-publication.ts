import { DOCUMENT } from '@angular/common';
import {
  afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, input, signal, viewChild, viewChildren,
} from '@angular/core';
import { SignalementPublication } from '../signalement-publication/signalement-publication';

let suivant = 0;

/**
 * Menu « ⋯ » d’une publication : partager son lien et, sauf pour l’auteur, la signaler.
 * Suit le modèle de bouton de menu WAI-ARIA : flèches, Origine/Fin, Échap rend le focus au bouton.
 */
@Component({
  selector: 'app-menu-publication',
  imports: [SignalementPublication],
  template: `
    <button #declencheur type="button" class="declencheur" aria-label="Plus d’actions sur cette publication"
      aria-haspopup="menu" [attr.aria-expanded]="menuOuvert()" [attr.aria-controls]="menuOuvert() ? idMenu : null"
      (click)="basculer()" (keydown.arrowdown)="ouvrirAuClavier($event, 0)" (keydown.arrowup)="ouvrirAuClavier($event, -1)">
      <i class="pi pi-ellipsis-h" aria-hidden="true"></i>
    </button>
    @if (menuOuvert()) {
      <ul class="menu" role="menu" [id]="idMenu" aria-label="Actions sur la publication" (keydown)="naviguer($event)">
        <li role="none">
          <button #element type="button" role="menuitem" tabindex="-1" (click)="partager()">
            <i class="pi pi-share-alt" aria-hidden="true"></i> Partager
          </button>
        </li>
        @if (peutSignaler()) {
          <li role="none">
            <button #element type="button" role="menuitem" tabindex="-1" class="signaler" [attr.aria-disabled]="signalee()"
              (click)="signaler()">
              <i class="pi" [class.pi-flag]="!signalee()" [class.pi-check-circle]="signalee()" aria-hidden="true"></i>
              {{ signalee() ? 'Publication signalée' : 'Signaler' }}
            </button>
          </li>
        }
      </ul>
    }
    <p class="retour" [class.visible]="retour()" role="status">{{ retour() }}</p>
    <app-signalement-publication [publicationId]="publicationId()" [(ouvert)]="signalementOuvert"
      (transmis)="apresSignalement($event)" (ferme)="rendreFocus()" />
  `,
  styles: `
    :host { position: relative; display: inline-block; }
    button { font: inherit; cursor: pointer; }
    button:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 1px; }
    .declencheur { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; padding: 0; border: 0;
      border-radius: 50%; background: transparent; color: var(--ept-text-secondary); }
    .declencheur:hover, .declencheur[aria-expanded='true'] { background: var(--ept-bg); color: var(--ept-primary); }
    .declencheur i { font-size: 1.05rem; }
    .menu { position: absolute; z-index: 20; top: calc(100% + .25rem); right: 0; min-width: 13rem; margin: 0; padding: .35rem;
      list-style: none; border: 1px solid var(--ept-border); border-radius: var(--ept-radius); background: var(--ept-surface);
      box-shadow: 0 12px 32px -12px rgb(1 40 60 / 35%); }
    .menu button { display: flex; align-items: center; gap: .65rem; width: 100%; min-height: 2.6rem; padding: .45rem .7rem;
      border: 0; border-radius: var(--ept-radius-sm); background: transparent; color: var(--ept-primary-dark); text-align: left; }
    .menu button:hover, .menu button:focus { background: var(--ept-primary-light); outline: none; }
    .menu button:focus-visible { box-shadow: inset 0 0 0 2px var(--ept-sky); }
    .menu i { width: 1rem; color: var(--ept-text-secondary); }
    .signaler:not([aria-disabled='true']):hover i, .signaler:not([aria-disabled='true']):focus i { color: var(--ept-error-dark); }
    .signaler[aria-disabled='true'] { color: var(--ept-text-secondary); cursor: default; }
    .retour { position: absolute; z-index: 20; top: calc(100% + .25rem); right: 0; margin: 0; padding: .4rem .7rem;
      border-radius: var(--ept-radius-sm); background: var(--ept-primary-dark); color: white; font-size: .82rem; width: max-content; max-width: min(16rem, 80vw);
      opacity: 0; pointer-events: none; transition: opacity .15s; }
    .retour.visible { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { .retour { transition: none; } }
  `,
  host: {
    '(document:click)': 'clicExterieur($event)',
    '(keydown.escape)': 'fermerMenu(true)',
  },
})
export class MenuPublication {
  readonly publicationId = input.required<string>();
  /** Faux pour l’auteur : on ne signale pas sa propre publication. */
  readonly peutSignaler = input(true);

  protected readonly idMenu = `menu-publication-${++suivant}`;
  protected readonly menuOuvert = signal(false);
  protected readonly signalementOuvert = signal(false);
  protected readonly signalee = signal(false);
  protected readonly retour = signal('');

  private readonly declencheur = viewChild.required<ElementRef<HTMLButtonElement>>('declencheur');
  private readonly elements = viewChildren<ElementRef<HTMLButtonElement>>('element');
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private minuterie: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.minuterie));
  }

  protected basculer(): void {
    if (this.menuOuvert()) this.fermerMenu(false);
    else this.ouvrir(0);
  }

  protected ouvrirAuClavier(event: Event, indice: number): void {
    event.preventDefault();
    this.ouvrir(indice);
  }

  protected naviguer(event: KeyboardEvent): void {
    const elements = this.elements().map((e) => e.nativeElement);
    const courant = elements.indexOf(this.document.activeElement as HTMLButtonElement);
    const cible = { ArrowDown: courant + 1, ArrowUp: courant - 1, Home: 0, End: elements.length - 1 }[event.key];
    if (event.key === 'Tab') { this.menuOuvert.set(false); return; }
    if (cible === undefined) return;
    event.preventDefault();
    elements[(cible + elements.length) % elements.length]?.focus();
  }

  fermerMenu(rendreFocus: boolean): void {
    if (!this.menuOuvert()) return;
    this.menuOuvert.set(false);
    if (rendreFocus) this.rendreFocus();
  }

  protected clicExterieur(event: Event): void {
    if (this.menuOuvert() && !this.hote.nativeElement.contains(event.target as Node)) this.menuOuvert.set(false);
  }

  protected partager(): void {
    this.fermerMenu(true);
    const fenetre = this.document.defaultView;
    const lien = new URL(`/publications/${this.publicationId()}`, this.document.baseURI).href;
    // Sur mobile, la feuille de partage du système ; ailleurs, le lien est copié.
    if (fenetre?.navigator.share && fenetre.matchMedia?.('(pointer: coarse)').matches) {
      fenetre.navigator.share({ title: 'Publication EPT Alumni', url: lien }).catch(() => undefined);
      return;
    }
    const pressePapiers = fenetre?.navigator.clipboard;
    if (!pressePapiers) { this.afficherRetour('Copie impossible : ' + lien); return; }
    pressePapiers.writeText(lien).then(
      () => this.afficherRetour('Lien copié'),
      () => this.afficherRetour('Le lien n’a pas pu être copié.'),
    );
  }

  protected signaler(): void {
    if (this.signalee()) return;
    this.menuOuvert.set(false);
    this.signalementOuvert.set(true);
  }

  protected apresSignalement(message: string): void {
    this.signalee.set(true);
    this.afficherRetour(message);
  }

  protected rendreFocus(): void {
    afterNextRender(() => this.declencheur().nativeElement.focus(), { injector: this.injector });
  }

  private ouvrir(indice: number): void {
    this.menuOuvert.set(true);
    afterNextRender(() => {
      const elements = this.elements();
      elements[(indice + elements.length) % elements.length]?.nativeElement.focus();
    }, { injector: this.injector });
  }

  private afficherRetour(message: string): void {
    this.retour.set(message);
    clearTimeout(this.minuterie);
    this.minuterie = setTimeout(() => this.retour.set(''), 4000);
  }
}
