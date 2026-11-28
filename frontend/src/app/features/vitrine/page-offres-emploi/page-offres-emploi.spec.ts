import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PageOffresEmploi } from './page-offres-emploi';

describe('PageOffresEmploi', () => {
  it('invite le visiteur à se connecter et explique qui peut publier', async () => {
    TestBed.configureTestingModule({
      imports: [PageOffresEmploi],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(PageOffresEmploi);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Offres d’emploi');
    expect(element.querySelector('main')?.textContent).not.toContain('À venir');
    expect(element.querySelector('#publier')?.textContent).toContain('Publier une offre');
    expect(element.querySelector('a[href="/connexion"]')?.textContent).toContain('Se connecter');
    expect(element.querySelector('a[href="/inscription"]')?.textContent).toContain('Créer un compte');
  });
});
