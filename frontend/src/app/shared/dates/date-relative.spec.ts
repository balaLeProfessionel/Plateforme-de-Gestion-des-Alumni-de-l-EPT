import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { dateRelative } from './date-relative';

describe('dateRelative', () => {
  beforeAll(() => registerLocaleData(localeFr));
  const maintenant = new Date(2026, 10, 4, 12, 0);
  const avant = (ms: number) => new Date(maintenant.getTime() - ms);

  it('parle en minutes et en heures le jour même', () => {
    expect(dateRelative(avant(20_000), maintenant)).toBe('à l’instant');
    expect(dateRelative(avant(5 * 60_000), maintenant)).toBe('il y a 5 min');
    expect(dateRelative(avant(3 * 3_600_000), maintenant)).toBe('il y a 3 h');
  });

  it('dit « hier », puis compte les jours sur une semaine', () => {
    expect(dateRelative(new Date(2026, 10, 3, 9, 0), maintenant)).toBe('hier');
    expect(dateRelative(new Date(2026, 10, 1, 9, 0), maintenant)).toBe('il y a 3 j');
  });

  it('donne la date au-delà d’une semaine, avec l’année si elle change', () => {
    expect(dateRelative(new Date(2026, 9, 12, 9, 0), maintenant)).toBe('12 oct.');
    expect(dateRelative(new Date(2025, 9, 12, 9, 0), maintenant)).toBe('12 oct. 2025');
  });
});
