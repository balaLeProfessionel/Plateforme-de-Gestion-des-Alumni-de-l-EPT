import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { authEmploi, pageDOffresEmploi, uneOffreEmploi } from '../testing/donnees-offres-emploi';
import { ListeOffresEmploi } from './liste-offres-emploi';

describe('ListeOffresEmploi', () => {
  let fixture: ComponentFixture<ListeOffresEmploi>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  const demarrer = (role = 'ALUMNI', params: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [ListeOffresEmploi],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)) } },
        { provide: AuthService, useValue: authEmploi(role) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ListeOffresEmploi);
    fixture.detectChanges();
    http.expectOne('/api/public/filieres').flush([{ id: 'f1', nom: 'Génie informatique' }]);
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('lit les critères dans l’URL et affiche les offres', () => {
    const racine = demarrer('ALUMNI', { type: 'STAGE', lieu: 'Dakar', filiere: 'f1', expirees: 'oui', page: '2' });
    const requete = http.expectOne((r) => r.url === '/api/offres-emploi');
    expect(requete.request.params.get('type')).toBe('STAGE');
    expect(requete.request.params.get('lieu')).toBe('Dakar');
    expect(requete.request.params.get('filiere')).toBe('f1');
    expect(requete.request.params.get('expirees')).toBe('true');
    expect(requete.request.params.get('page')).toBe('2');
    requete.flush(pageDOffresEmploi([uneOffreEmploi(), uneOffreEmploi({ id: 'e2', titre: 'Data analyst' })]));
    fixture.detectChanges();
    expect(racine.querySelector('.resume')?.textContent).toContain('2 offres');
    expect(racine.querySelectorAll('app-carte-offre-emploi').length).toBe(2);
    expect((racine.querySelector('#filtre-lieu') as HTMLInputElement).value).toBe('Dakar');
  });

  it('met le type choisi dans l’URL et revient à la première page', () => {
    const racine = demarrer('ALUMNI', { page: '1' });
    http.expectOne((r) => r.url === '/api/offres-emploi').flush(pageDOffresEmploi([uneOffreEmploi()]));
    fixture.detectChanges();
    ([...racine.querySelectorAll('.types button')].find((b) => b.textContent?.includes('CDI')) as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { type: 'CDI' }, replaceUrl: true }));
  });

  it('propose de relayer et de suivre ses candidatures à un alumni, de publier à un organisme', () => {
    const alumni = demarrer('ALUMNI');
    http.expectOne((r) => r.url === '/api/offres-emploi').flush(pageDOffresEmploi([]));
    fixture.detectChanges();
    expect(alumni.querySelector('a[href="/offres-emploi/relayer"]')).not.toBeNull();
    expect(alumni.querySelector('a[href="/offres-emploi/mes-candidatures"]')).not.toBeNull();
    expect(alumni.querySelector('a[href="/offres-emploi/publier"]')).toBeNull();
    expect(alumni.querySelector('.etat')?.textContent).toContain('Relayez-la');

    TestBed.resetTestingModule();
    const organisme = demarrer('ORGANISME');
    http.expectOne((r) => r.url === '/api/offres-emploi').flush(pageDOffresEmploi([]));
    fixture.detectChanges();
    expect(organisme.querySelector('a[href="/offres-emploi/relayer"]')).toBeNull();
    expect(organisme.querySelector('a[href="/offres-emploi/publier"]')).not.toBeNull();
    expect(organisme.querySelector('a[href="/offres-emploi/mes-candidatures"]')).toBeNull();
  });

  it('dit quand le chargement échoue', () => {
    const racine = demarrer();
    http.expectOne((r) => r.url === '/api/offres-emploi').flush({ message: 'Service indisponible.' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Service indisponible.');
  });
});
