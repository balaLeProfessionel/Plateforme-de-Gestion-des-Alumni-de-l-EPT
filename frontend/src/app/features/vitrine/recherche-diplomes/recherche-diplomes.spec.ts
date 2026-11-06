import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RechercheDiplomes } from './recherche-diplomes';

describe('RechercheDiplomes', () => {
  async function creer(recherche: string) {
    await TestBed.configureTestingModule({
      imports: [RechercheDiplomes],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(recherche ? { recherche } : {})) } }
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RechercheDiplomes);
    await fixture.whenStable();
    return { fixture, http: TestBed.inject(HttpTestingController), element: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('n interroge pas le serveur avec moins de 3 lettres', async () => {
    const { http } = await creer('so');
    http.expectNone((requete) => requete.url === '/api/public/annuaire');
  });

  it('affiche le nom, la promotion et la filiere', async () => {
    const { fixture, http, element } = await creer('sow');
    http.expectOne('/api/public/annuaire?recherche=sow').flush([
      { prenom: 'Awa', nom: 'Sow', promotion: 2018, filiere: 'Génie Civil' }
    ]);
    await fixture.whenStable();

    expect(element.querySelector('.liste li')?.textContent).toContain('Awa Sow');
    expect(element.querySelector('.liste li')?.textContent).toContain('Promo 2018');
    expect(element.querySelector('.liste li')?.textContent).toContain('Génie Civil');
  });

  it('distingue l absence de resultat', async () => {
    const { fixture, http, element } = await creer('xyz');
    http.expectOne('/api/public/annuaire?recherche=xyz').flush([]);
    await fixture.whenStable();

    expect(element.querySelector('.resultats')?.textContent).toContain('Aucun diplômé trouvé pour « xyz »');
  });

  it('explique la limite de frequence du serveur', async () => {
    const { fixture, http, element } = await creer('sow');
    http.expectOne('/api/public/annuaire?recherche=sow').flush({}, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Réessayez dans une minute');
  });
});
