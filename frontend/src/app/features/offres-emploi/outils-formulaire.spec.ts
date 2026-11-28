import { dateDans, decouper } from './outils-formulaire';

describe('outils-formulaire', () => {
  it('ramène un jour absent du mois cible à son dernier jour, comme le serveur', () => {
    expect(dateDans(6, new Date('2026-08-31T12:00:00Z'))).toBe('2027-02-28');
    expect(dateDans(6, new Date('2027-08-31T12:00:00Z'))).toBe('2028-02-29');
    expect(dateDans(6, new Date('2026-12-31T12:00:00Z'))).toBe('2027-06-30');
    expect(dateDans(6, new Date('2026-11-15T12:00:00Z'))).toBe('2027-05-15');
  });

  it('prend « aujourd’hui » à Dakar, pas dans le fuseau du navigateur', () => {
    // 21 h à New York le 30 novembre : il est déjà 2 h le 1er décembre à Dakar.
    expect(dateDans(0, new Date('2026-11-30T21:00:00-05:00'))).toBe('2026-12-01');
    // 0 h 30 à Paris le 1er décembre : il est encore 23 h 30 le 30 novembre à Dakar.
    expect(dateDans(0, new Date('2026-12-01T00:30:00+01:00'))).toBe('2026-11-30');
  });

  it('découpe les compétences sans doublon', () => {
    expect(decouper('Java, spring  boot ; java\nSQL')).toEqual(['Java', 'spring boot', 'SQL']);
  });
});
