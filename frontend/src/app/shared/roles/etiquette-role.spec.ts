import { TestBed } from '@angular/core/testing';

import { EtiquetteRole } from './etiquette-role';

describe('EtiquetteRole', () => {
  it.each([
    ['ALUMNI', 'Alumni', 'pi-graduation-cap'],
    ['ETUDIANT', 'Étudiant', 'pi-book'],
    ['PERSONNEL', 'Personnel EPT', 'pi-id-card'],
    ['VISITEUR', 'Visiteur', 'pi-user'],
  ])('affiche le type %s avec son libellé et son icône', (role, libelle, icone) => {
    const fixture = TestBed.createComponent(EtiquetteRole);
    fixture.componentRef.setInput('role', role);
    fixture.detectChanges();
    const hote: HTMLElement = fixture.nativeElement;
    expect(hote.getAttribute('data-role')).toBe(role);
    expect(hote.textContent?.trim()).toBe(libelle);
    expect(hote.querySelector('i')?.classList).toContain(icone);
  });

  it('n’affiche rien pour un rôle inconnu', () => {
    const fixture = TestBed.createComponent(EtiquetteRole);
    fixture.componentRef.setInput('role', 'ORGANISME');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
