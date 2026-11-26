import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MessageSection } from '../message-section.model';

// Une expérience ou une formation repliée : l'essentiel sur une ligne et un bouton
// « Modifier » qui ouvre la carte complète (une seule ouverte à la fois).
@Component({
  selector: 'app-resume-parcours',
  imports: [DatePipe],
  template: `
    <div class="resume">
      <div class="texte">
        <p class="titre">{{ titre() }}</p>
        <p class="detail">
          {{ organisme() }}
          @if (etiquette()) { <span aria-hidden="true">·</span> {{ etiquette() }} }
        </p>
        <p class="dates">
          @if (fin(); as dateFin) {
            {{ debut() | date: 'MMM yyyy' }} – {{ dateFin | date: 'MMM yyyy' }}
          } @else {
            Depuis {{ debut() | date: 'MMM yyyy' }}
          }
        </p>
      </div>
      <button type="button" class="btn-modifier" [id]="'modifier-' + cle()"
              [attr.aria-label]="'Modifier ' + titre()" (click)="modifier.emit()">
        <i class="pi pi-pencil" aria-hidden="true"></i><span>Modifier</span>
      </button>
    </div>
    <div class="zone-message" aria-live="polite">
      @if (message(); as m) {
        <p class="message" [class.erreur]="m.type === 'erreur'">{{ m.texte }}</p>
      }
    </div>
  `,
  styles: `
    :host { display: block; border: 1px solid var(--ept-border); border-radius: var(--ept-radius-sm); padding: 0.85rem 1rem; }
    .resume { display: flex; align-items: center; gap: 0.75rem; }
    .texte { flex: 1; min-width: 0; }
    p { margin: 0; overflow-wrap: anywhere; }
    .titre { font-weight: 600; color: var(--ept-primary-dark); }
    .detail { font-size: 0.9rem; }
    .dates { font-size: 0.82rem; color: var(--ept-text-secondary); margin-top: 0.15rem; }
    .btn-modifier {
      display: inline-flex; align-items: center; gap: 0.4rem; min-height: 44px; padding: 0 0.9rem; flex-shrink: 0;
      border: 1px solid var(--ept-border-champ); border-radius: var(--ept-radius-sm); background: var(--ept-surface);
      color: var(--ept-primary); font: inherit; font-size: 0.88rem; font-weight: 600; cursor: pointer;
    }
    .btn-modifier:hover { background: var(--ept-primary-light); }
    .btn-modifier:focus-visible { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; }
    .zone-message:empty { display: none; }
    .message { margin-top: 0.5rem; font-size: 0.85rem; color: var(--ept-success-dark); }
    .message.erreur { color: var(--ept-error-dark); }
  `
})
export class ResumeParcours {
  readonly cle = input.required<string>();
  readonly titre = input.required<string>();
  readonly organisme = input('');
  readonly etiquette = input<string | null>(null);
  readonly debut = input.required<string>();
  readonly fin = input<string | null>(null);
  readonly message = input<MessageSection | null>(null);

  readonly modifier = output<void>();
}
