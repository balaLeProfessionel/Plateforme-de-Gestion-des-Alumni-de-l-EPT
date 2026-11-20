import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

/**
 * Date courte et parlante pour un fil : « à l’instant », « il y a 5 min », « il y a 3 h », « hier »,
 * « il y a 4 j », puis la date (« 12 oct. », avec l’année si ce n’est pas l’année en cours).
 */
export function dateRelative(date: string | Date, maintenant: Date, locale = 'fr'): string {
  const instant = new Date(date);
  const ecart = maintenant.getTime() - instant.getTime();
  if (ecart < MINUTE) return 'à l’instant';
  if (ecart < HEURE) return `il y a ${Math.floor(ecart / MINUTE)} min`;
  if (ecart < JOUR) return `il y a ${Math.floor(ecart / HEURE)} h`;
  const jours = Math.round((debutJour(maintenant) - debutJour(instant)) / JOUR);
  if (jours <= 1) return 'hier';
  if (jours < 7) return `il y a ${jours} j`;
  const memeAnnee = instant.getFullYear() === maintenant.getFullYear();
  return formatDate(instant, memeAnnee ? 'd MMM' : 'd MMM y', locale);
}

function debutJour(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Calculée à l’affichage : une carte reste à jour dès qu’elle est redessinée. */
@Pipe({ name: 'dateRelative' })
export class DateRelativePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(date: string | null | undefined): string {
    return date ? dateRelative(date, new Date(), this.locale) : '';
  }
}
