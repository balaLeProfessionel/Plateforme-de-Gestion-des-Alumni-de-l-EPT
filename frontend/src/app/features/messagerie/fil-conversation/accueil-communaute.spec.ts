import { modeEntree } from './accueil-communaute';

describe('modeEntree', () => {
  it('rattache promo et filière au profil', () => {
    expect(modeEntree({ categorie: 'PROMO', acces: 'OUVERTE' })).toContain('par votre promo');
    expect(modeEntree({ categorie: 'FILIERE', acces: 'OUVERTE' })).toContain('par votre filière');
    expect(modeEntree({ categorie: 'PROMO_FILIERE', acces: 'OUVERTE' })).toContain('par votre promo et votre filière');
  });

  it('dit qu’une communauté de ville, de secteur ou d’intérêt se rejoint par choix', () => {
    expect(modeEntree({ categorie: 'VILLE', acces: 'OUVERTE' })).toContain('Vous pouvez la quitter');
    expect(modeEntree({ categorie: 'INTERET', acces: 'SUR_DEMANDE' })).toContain('sur demande');
  });
});
