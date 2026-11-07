import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { RechercheSite } from './recherche-site';

describe('RechercheSite', () => {
  async function creer(q: string) {
    await TestBed.configureTestingModule({
      imports: [RechercheSite],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(q ? { q } : {})) } }
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(RechercheSite);
    await fixture.whenStable();
    return { fixture, http: TestBed.inject(HttpTestingController), element: fixture.nativeElement as HTMLElement };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('n affiche rien et n interroge pas le serveur sans recherche', async () => {
    const { http, element } = await creer('');
    http.expectNone((requete) => requete.url === '/api/public/annuaire');
    expect(element.querySelector('.liste')).toBeNull();
  });

  it('montre les pages et les diplomes pour la meme recherche', async () => {
    const { fixture, http, element } = await creer('stages');
    http.expectOne('/api/public/annuaire?recherche=stages').flush([
      { prenom: 'Awa', nom: 'Stages', promotion: 2018, filiere: 'Génie Civil' }
    ]);
    await fixture.whenStable();

    expect(element.querySelector('section[aria-labelledby="titre-pages"] a[href="/stages"]')?.textContent).toContain('À venir');
    expect(element.querySelector('.diplome')?.textContent).toContain('Awa Stages');
    expect(element.querySelector('a.suite')?.getAttribute('href')).toBe('/annuaire-diplomes?recherche=stages');
  });

  it('garde les pages si la recherche de diplomes echoue', async () => {
    const { fixture, http, element } = await creer('stages');
    http.expectOne('/api/public/annuaire?recherche=stages').flush({}, { status: 429, statusText: 'Too Many Requests' });
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Réessayez dans une minute');
    expect(element.querySelector('a[href="/stages"]')).not.toBeNull();
  });

  it('annonce une recherche sans aucun resultat', async () => {
    const { fixture, http, element } = await creer('zzzqq');
    http.expectOne('/api/public/annuaire?recherche=zzzqq').flush([]);
    await fixture.whenStable();

    expect(element.querySelector('.resultats')?.textContent).toContain('Aucun résultat pour « zzzqq »');
    expect(element.querySelector('section')).toBeNull();
  });

  it('cherche les pages des 2 lettres, sans interroger les diplomes', async () => {
    const { http, element } = await creer('ep');
    http.expectNone((requete) => requete.url === '/api/public/annuaire');
    expect(element.querySelector('section[aria-labelledby="titre-diplomes"]')).toBeNull();
    expect(element.querySelector('.liste')).not.toBeNull();
  });
});
