import { Component, computed, input, output } from '@angular/core';

/** Pagination de la liste des événements : précédente, numéros (avec « … ») et suivante. Pages comptées à partir de 0. */
@Component({
  selector: 'app-pagination-evenements',
  templateUrl: './pagination-evenements.html',
  styleUrl: './pagination-evenements.scss'
})
export class PaginationEvenements {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly changer = output<number>();

  /** Toutes les pages jusqu'à 5 ; au-delà, la première, la dernière et les voisines de la page courante. */
  protected readonly pagesVisibles = computed<(number | 'ellipsis')[]>(() => {
    const page = this.page();
    const total = this.totalPages();
    if (total <= 1) return [];
    if (total <= 5) return Array.from({ length: total }, (_, index) => index);
    const pages = [...new Set([0, page - 1, page, page + 1, total - 1])]
      .filter((index) => index >= 0 && index < total)
      .sort((a, b) => a - b);
    return pages.flatMap((index, position) => position > 0 && index - pages[position - 1] > 1
      ? ['ellipsis' as const, index]
      : [index]);
  });
}
