import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';

/**
 * Visuel 16:9 d'un événement : son image (déjà au format imposé), ou une affiche datée aux couleurs
 * EPT. L'affiche est décorative : la date, le lieu et le titre figurent aussi en texte à côté.
 */
@Component({
  selector: 'app-visuel-evenement',
  imports: [DatePipe],
  template: `
    @if (urlImage()) {
      <img [src]="urlImage()" [alt]="alternative()" [attr.loading]="chargementDiffere() ? 'lazy' : null" />
    } @else {
      <div class="affiche" aria-hidden="true">
        <span class="marque">EPT Alumni</span>
        @if (officiel()) {
          <span class="officiel"><i class="pi pi-verified"></i>Officiel EPT</span>
        }
        @if (dateDebut(); as date) {
          <span class="date">
            <strong>{{ date | date: 'd' }}</strong>
            <span>{{ date | date: 'MMM' }}</span>
            <small>{{ date | date: 'y' }}</small>
          </span>
        } @else {
          <i class="pi pi-calendar icone"></i>
        }
        @if (lieu(); as texte) {
          <span class="lieu"><i class="pi pi-map-marker"></i>{{ texte }}</span>
        }
      </div>
    }
  `,
  styles: `
    :host { display: block; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--ept-primary-dark); container-type: inline-size; }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }

    .affiche {
      position: relative;
      display: grid;
      width: 100%;
      height: 100%;
      grid-template-rows: auto 1fr auto;
      padding: 5cqi 6cqi;
      background:
        repeating-linear-gradient(135deg, rgb(115 219 242 / 0.07) 0 2px, transparent 2px 22px),
        radial-gradient(circle at 85% 15%, rgb(115 219 242 / 0.28), transparent 45%),
        linear-gradient(135deg, var(--ept-primary), var(--ept-primary-dark));
      color: white;
    }
    .marque { color: var(--ept-sky); font-size: clamp(0.6rem, 3.2cqi, 0.85rem); font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
    .officiel {
      position: absolute;
      top: 4.5cqi;
      right: 5cqi;
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      padding: 0.25em 0.6em;
      border-radius: 999px;
      background: var(--ept-sky);
      color: var(--ept-primary-dark);
      font-size: clamp(0.6rem, 3cqi, 0.8rem);
      font-weight: 700;
    }
    .date {
      display: grid;
      align-self: center;
      justify-self: start;
      justify-items: center;
      min-width: 22cqi;
      padding: 2.5cqi 4cqi;
      border-radius: 2.5cqi;
      background: white;
      color: var(--ept-primary-dark);
      box-shadow: 0 1.5cqi 4cqi rgb(1 20 32 / 0.35);
      line-height: 1;

      strong { font-family: var(--ept-font-heading); font-size: clamp(1.4rem, 13cqi, 4.2rem); }
      span { margin-top: 0.15em; color: var(--ept-primary); font-size: clamp(0.7rem, 4.6cqi, 1.4rem); font-weight: 700; text-transform: uppercase; }
      small { margin-top: 0.3em; color: var(--ept-text-secondary); font-size: clamp(0.55rem, 2.8cqi, 0.85rem); font-weight: 600; }
    }
    .icone { align-self: center; color: var(--ept-sky); font-size: clamp(1.5rem, 12cqi, 4rem); }
    .lieu {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      min-width: 0;
      overflow: hidden;
      font-size: clamp(0.65rem, 3.6cqi, 1rem);
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;

      i { color: var(--ept-sky); }
    }
  `,
})
export class VisuelEvenement {
  readonly urlImage = input<string | null>(null);
  readonly dateDebut = input<string | null>(null);
  readonly lieu = input<string | null>(null);
  readonly officiel = input(false);
  /** Texte alternatif de l'image ; vide quand elle est purement décorative (dans une carte). */
  readonly alternative = input('');
  readonly chargementDiffere = input(false);
}
