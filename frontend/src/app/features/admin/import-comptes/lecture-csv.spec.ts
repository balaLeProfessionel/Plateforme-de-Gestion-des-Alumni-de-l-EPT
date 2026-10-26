import { lireCsvComptes } from './lecture-csv';

describe('lireCsvComptes', () => {
  it('lit un export de tableur français, colonnes dans le désordre et accents dans les en-têtes', () => {
    const lecture = lireCsvComptes('\uFEFFNom;Prénom;E-mail;Filière;Année entrée\r\nDiop;Awa;Awa.Diop@EPT.sn;"Génie civil; option eau";2026\r\n\r\n');
    expect(lecture.erreur).toBeNull();
    expect(lecture.lignes).toEqual([{
      numero: 1, prenom: 'Awa', nom: 'Diop', email: 'awa.diop@ept.sn', filiere: 'Génie civil; option eau',
      anneeEntree: 2026, anneeSortie: null, probleme: null,
    }]);
  });

  it('accepte la virgule et signale chaque ligne à corriger', () => {
    const lecture = lireCsvComptes([
      'prenom,nom,email,annee_entree',
      'Awa,Diop,awa@ept.sn,2026',
      ',Sow,binta@ept.sn,2026',
      'Coumba,Fall,pas-une-adresse,2026',
      'Dame,Ka,awa@ept.sn,2026',
      'Eva,Ndiaye,eva@ept.sn,26',
    ].join('\n'));
    expect(lecture.lignes.map((ligne) => ligne.probleme)).toEqual([
      null, 'Prénom ou nom manquant.', 'Adresse e-mail invalide.', 'Adresse en double dans le fichier.', 'Année invalide.',
    ]);
  });

  it('refuse un fichier sans les colonnes obligatoires ou vide', () => {
    expect(lireCsvComptes('prenom;filiere\nAwa;GIT').erreur).toBe('Colonnes obligatoires absentes : nom, e-mail.');
    expect(lireCsvComptes('prenom;nom;email').erreur).toContain('au moins un compte');
  });
});
