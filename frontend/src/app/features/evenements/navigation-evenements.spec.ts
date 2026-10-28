import { urlRetourInterne } from './navigation-evenements';

describe('navigation des événements', () => {
  it('conserve une URL interne complète avec ses filtres', () => {
    expect(urlRetourInterne('/evenements?vue=mes&periode=PASSES&page=2'))
      .toBe('/evenements?vue=mes&periode=PASSES&page=2');
  });

  it('ignore une destination externe ou une URL ambiguë', () => {
    expect(urlRetourInterne('https://exemple.invalid')).toBeNull();
    expect(urlRetourInterne('//exemple.invalid')).toBeNull();
    expect(urlRetourInterne('/\\exemple.invalid')).toBeNull();
    expect(urlRetourInterne('/evenements\\..\\connexion')).toBeNull();
  });
});
