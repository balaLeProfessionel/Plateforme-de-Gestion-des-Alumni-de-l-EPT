import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BandeauProfilCv } from './bandeau-profil-cv';

describe('BandeauProfilCv', () => {
  function creer() {
    TestBed.configureTestingModule({ imports: [BandeauProfilCv], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(BandeauProfilCv);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('annonce le profil rempli et mène à la page de modification', () => {
    const { element } = creer();
    expect(element.querySelector('[role="status"] h2')?.textContent).toContain('Votre profil est prêt');
    expect(element.querySelector('a.verifier')?.getAttribute('href')).toBe('/profil/parametres');
  });

  it('disparaît quand on le ferme', async () => {
    const { fixture, element } = creer();
    element.querySelector<HTMLButtonElement>('button[aria-label="Fermer ce message"]')!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('.bandeau')).toBeNull();
  });
});
