import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

/** Silhouette d’une carte de l’annuaire pendant le chargement : bandeau, avatar, nom, deux lignes, bouton. */
@Component({
  selector: 'app-carte-membre-squelette',
  imports: [SkeletonModule],
  host: { 'aria-hidden': 'true' },
  template: `
    <p-skeleton height="4rem" borderRadius="0" />
    <p-skeleton shape="circle" size="4.5rem" class="avatar" />
    <div class="corps">
      <p-skeleton width="65%" height="1.1rem" />
      <p-skeleton width="80%" height="0.75rem" />
      <p-skeleton width="55%" height="0.75rem" />
      <p-skeleton height="2.1rem" borderRadius="8px" class="action" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 15.5rem;
      overflow: hidden;
      border: 1px solid var(--ept-border);
      border-radius: 12px;
      background: var(--ept-surface);
    }
    .avatar { align-self: center; margin-top: -2.5rem; border: 3px solid var(--ept-surface); border-radius: 50%; }
    .corps { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem 1rem; }
    .action { align-self: stretch; margin-top: auto; }
  `,
})
export class CarteMembreSquelette {}
