import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { MesSuivis } from '../../../core/services/models/stage.model';
import { authStages, unSuivi } from '../testing/donnees-stages';
import { SuiviStagesMembre } from './suivi-stages';

describe('SuiviStagesMembre', () => {
  let http: HttpTestingController;

  const afficher = (role: string, suivis: MesSuivis) => {
    TestBed.configureTestingModule({
      imports: [SuiviStagesMembre],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), { provide: AuthService, useValue: authStages(role) }],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SuiviStagesMembre);
    fixture.detectChanges();
    http.expectOne('/api/stages/suivi').flush(suivis);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('montre à l’encadrant ses stages et ceux de son département', () => {
    const racine = afficher('PERSONNEL', {
      encadres: [unSuivi({ encadrant: { id: 'p1', prenom: 'Ibrahima', nom: 'Sow', email: 'isow@ept.sn' } })],
      departement: [unSuivi({ id: 's2' }), unSuivi({ id: 's3', deroulement: 'EN_COURS' })], accueillis: [],
    });
    expect(racine.querySelector('#titre-encadres')?.textContent).toContain('1');
    expect(racine.querySelectorAll('app-fiche-suivi')).toHaveLength(3);
    expect(racine.querySelector('app-fiche-suivi')?.textContent).toContain('Ibrahima Sow');
    expect(racine.querySelector('app-fiche-suivi')?.textContent).toContain('DIC2 · Génie Civil');
    expect(racine.querySelectorAll('.deroulement')[2].textContent).toBe('En cours');
  });

  it('montre à l’organisme ses stagiaires, sans section de département', () => {
    const racine = afficher('ORGANISME', { encadres: [], departement: [], accueillis: [unSuivi({ email: null })] });
    expect(racine.querySelector('#titre-accueillis')).not.toBeNull();
    expect(racine.querySelector('#titre-departement')).toBeNull();
    expect(racine.querySelector('app-fiche-suivi')?.textContent).toContain('Pas encore désigné');
    expect(racine.querySelector('app-fiche-suivi a[href^="mailto:awa"]')).toBeNull();
  });

  it('dit à un encadrant sans stage qu’il n’en a pas encore', () => {
    expect(afficher('PERSONNEL', { encadres: [], departement: [], accueillis: [] }).querySelector('.vide')?.textContent)
      .toContain('d’aucun stage');
  });
});
