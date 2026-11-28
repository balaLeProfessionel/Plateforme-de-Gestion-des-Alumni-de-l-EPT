import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { pageDOffresMobilite, uneOffreMobilite } from '../testing/donnees-mobilites';
import { ListeOffresMobilite } from './liste-offres-mobilite';

describe('ListeOffresMobilite', () => {
  let fixture: ComponentFixture<ListeOffresMobilite>;
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.fn>;

  const demarrer = (params: Record<string, string> = {}) => {
    TestBed.configureTestingModule({
      imports: [ListeOffresMobilite],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: new BehaviorSubject(convertToParamMap(params)) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ListeOffresMobilite);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('lit les critères dans l’URL et signale une offre où l’on n’est pas éligible', () => {
    const racine = demarrer({ type: 'ECHANGE', pays: 'Canada', periode: 'SEMESTRE_1', annee: '2027-2028', eligibles: 'oui' });
    const requete = http.expectOne((r) => r.url === '/api/mobilites/offres');
    expect(requete.request.params.get('type')).toBe('ECHANGE');
    expect(requete.request.params.get('pays')).toBe('Canada');
    expect(requete.request.params.get('periode')).toBe('SEMESTRE_1');
    expect(requete.request.params.get('annee')).toBe('2027-2028');
    expect(requete.request.params.get('eligibles')).toBe('true');
    requete.flush(pageDOffresMobilite([
      uneOffreMobilite(),
      uneOffreMobilite({ id: 'm2', eligibilite: { eligible: false, raison: 'Cette offre est réservée aux classes DIC2.' } }),
    ]));
    fixture.detectChanges();

    expect(racine.querySelector('.resume')?.textContent).toContain('2 offres');
    const cartes = [...racine.querySelectorAll('app-carte-offre-mobilite')];
    expect(cartes[0].querySelector('a')?.getAttribute('href')).toBe('/mobilites/offres/m1');
    expect(cartes[0].textContent).toContain('Québec, Canada');
    expect(cartes[0].textContent).toContain('Semestre 1 · 2027-2028');
    expect(cartes[1].textContent).toContain('réservée aux classes DIC2');
  });

  it('remet la page à zéro quand un filtre change et l’indique dans l’URL', () => {
    const racine = demarrer({ page: '2' });
    http.expectOne((r) => r.url === '/api/mobilites/offres').flush(pageDOffresMobilite([]));
    fixture.detectChanges();
    expect(racine.textContent).toContain('Aucune offre de mobilité n’est publiée');

    (racine.querySelector('.types button:nth-child(3)') as HTMLButtonElement).click();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { type: 'DOUBLE_DIPLOME' }, replaceUrl: true }));
  });
});
