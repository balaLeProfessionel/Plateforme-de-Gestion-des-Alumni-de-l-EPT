import { formaterTaille, verifierPieceJointe } from './pieces-jointes';

describe('pièces jointes', () => {
  it('écrit la taille à la française', () => {
    expect(formaterTaille(850)).toBe('850 o');
    expect(formaterTaille(12 * 1024)).toBe('12 Ko');
    expect(formaterTaille(3.4 * 1024 * 1024)).toBe('3,4 Mo');
  });

  it('accepte les types prévus jusqu’à 10 Mo, et refuse le reste', () => {
    expect(verifierPieceJointe(new File(['x'], 'Rapport.PDF'))).toBeNull();
    expect(verifierPieceJointe(new File(['x'], 'photo.jpeg'))).toBeNull();
    expect(verifierPieceJointe(new File(['x'], 'dessin.svg'))).toContain('n’est pas accepté');
    expect(verifierPieceJointe(new File(['x'], 'sans-extension'))).toContain('n’est pas accepté');
    expect(verifierPieceJointe(new File([], 'vide.txt'))).toBe('Le fichier choisi est vide.');
    const gros = new File(['x'], 'gros.pdf');
    Object.defineProperty(gros, 'size', { value: 10 * 1024 * 1024 + 1 });
    expect(verifierPieceJointe(gros)).toBe('Le fichier joint ne doit pas dépasser 10 Mo.');
  });
});
