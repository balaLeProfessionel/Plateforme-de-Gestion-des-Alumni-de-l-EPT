import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

/** Mois abrégé pour une tuile de calendrier, sans le point de l’abréviation : « nov. » → « nov ». */
@Pipe({ name: 'moisCourt' })
export class MoisCourtPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(date: string | Date | null | undefined): string {
    return date ? formatDate(date, 'MMM', this.locale).replace('.', '') : '';
  }
}
