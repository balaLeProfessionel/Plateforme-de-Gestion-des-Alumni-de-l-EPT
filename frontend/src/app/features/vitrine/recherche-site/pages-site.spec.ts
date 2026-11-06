import { chercherPages } from './pages-site';

describe('chercherPages', () => {
  const titres = (recherche: string) => chercherPages(recherche).map((page) => page.titre);

  it('ignore les accents, la casse et la ponctuation', () => {
    expect(titres('EVENEMENT')).toContain('Tous les événements');
    expect(titres('offres d’emploi')).toContain('Offres d’emploi');
  });

  it('trouve les rubriques a venir en le signalant', () => {
    const stages = chercherPages('stages').find((page) => page.titre === 'Stages');
    expect(stages?.lien).toBe('/stages');
    expect(stages?.precision).toBe('À venir');
  });

  it('exige tous les mots et place les titres en premier', () => {
    expect(titres('mentorat planifier')).toEqual(['Mentorat']);
    expect(titres('mentorat')[0]).toBe('Mentorat');
  });

  it('ne renvoie rien sans mot ou sans correspondance', () => {
    expect(chercherPages('  ')).toEqual([]);
    expect(chercherPages('zzzqq')).toEqual([]);
  });
});
