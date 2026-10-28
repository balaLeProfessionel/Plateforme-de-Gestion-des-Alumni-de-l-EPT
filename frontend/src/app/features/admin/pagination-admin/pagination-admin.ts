import { Component, input, output } from '@angular/core';

/** Pagination « Précédent / Page n sur m / Suivant » commune aux listes de l’administration. */
@Component({
  selector: 'app-pagination-admin',
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" [attr.aria-label]="libelle()">
        <button type="button" [disabled]="page() === 0" (click)="changer.emit(page() - 1)">Précédent</button>
        <span>Page {{ page() + 1 }} sur {{ totalPages() }}</span>
        <button type="button" [disabled]="page() + 1 >= totalPages()" (click)="changer.emit(page() + 1)">Suivant</button>
      </nav>
    }
  `,
  styles: `
    .pagination {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 0.75rem;
      margin-top: 1.25rem; color: var(--ept-text-secondary); font-size: 0.85rem;
    }
    button {
      min-height: 2.5rem; padding: 0.45rem 0.9rem; border: 1px solid var(--ept-border); border-radius: 8px;
      background: white; color: var(--ept-primary); font: inherit; font-weight: 600; cursor: pointer;
      &:disabled { opacity: 0.45; cursor: default; }
      &:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 1px; }
    }
  `,
})
export class PaginationAdmin {
  /** Page courante, à partir de 0. */
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly libelle = input('Pagination');
  readonly changer = output<number>();
}
