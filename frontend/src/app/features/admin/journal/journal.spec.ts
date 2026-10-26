import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { Journal } from './journal';

describe('Journal', () => {
  let fixture: ComponentFixture<Journal>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const parametres = new BehaviorSubject(convertToParamMap({ filtre: 'suspensions', page: '2' }));
    TestBed.configureTestingModule({
      imports: [Journal],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres, snapshot: { queryParamMap: parametres.value } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(Journal);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('lit le filtre et la page dans l’URL et affiche chaque décision avec son compte', async () => {
    const requete = http.expectOne((req) => req.url === '/api/admin/journal');
    expect(requete.request.params.getAll('type')).toEqual(['SUSPENSION', 'REACTIVATION']);
    expect(requete.request.params.get('page')).toBe('1');
    requete.flush({
      contenu: [{ id: 'a1', type: 'SUSPENSION', motif: 'Spam', details: null, dateAction: '2026-10-24T10:00:00Z', auteur: 'Mame Diarra Ndour',
        cibleId: 'c9', cibleNom: 'Compte Suspendu', cibleRole: 'ALUMNI' }],
      page: 1, taille: 20, totalElements: 21, totalPages: 2,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect([...racine.querySelectorAll('.filtres button')].map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'true', 'false']);
    const entree = racine.querySelector('.journal li') as HTMLElement;
    expect(entree.textContent).toContain('Compte suspendu');
    expect(entree.textContent).toContain('par Mame Diarra Ndour');
    expect(entree.textContent).toContain('Spam');
    expect(entree.querySelector('a')?.getAttribute('href')).toBe('/admin/comptes/c9');
    expect(racine.querySelector('.resume')?.textContent).toContain('page 2 sur 2');

    (racine.querySelectorAll('.filtres button')[1] as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { filtre: 'inscriptions' }, replaceUrl: true }));
    (racine.querySelector('.pagination button') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { filtre: 'suspensions' }, replaceUrl: false }));
  });
});
