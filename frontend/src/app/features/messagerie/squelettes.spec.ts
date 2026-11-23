import { TestBed } from '@angular/core/testing';

import { SqueletteFil, SqueletteLignes } from './squelettes';

describe('Squelettes de chargement', () => {
  it('annonce le chargement du fil et masque les bulles fantômes aux lecteurs d’écran', () => {
    const fixture = TestBed.createComponent(SqueletteFil);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Chargement des messages…');
    expect(racine.querySelector('ul')?.getAttribute('aria-hidden')).toBe('true');
    expect(racine.querySelectorAll('li.moi').length).toBeGreaterThan(0);
    expect(racine.querySelectorAll('li:not(.moi)').length).toBeGreaterThan(0);
  });

  it('dessine le nombre de lignes demandé avec son libellé', () => {
    const fixture = TestBed.createComponent(SqueletteLignes);
    fixture.componentRef.setInput('nombre', 4);
    fixture.componentRef.setInput('libelle', 'Chargement des membres bloqués…');
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelectorAll('li')).toHaveLength(4);
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Chargement des membres bloqués…');
  });
});
