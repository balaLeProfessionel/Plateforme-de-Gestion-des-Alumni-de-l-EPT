import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Convention } from '../../../core/services/models/partenariat.model';
import { uneConvention } from '../testing/donnees-partenariat';
import { MesConventions } from './mes-conventions';

describe('MesConventions', () => {
  let http: HttpTestingController;

  const afficher = (conventions: Convention[]) => {
    TestBed.configureTestingModule({
      imports: [MesConventions],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MesConventions);
    fixture.detectChanges();
    http.expectOne('/api/partenariats/conventions').flush(conventions);
    http.expectOne('/api/partenariats/mon-partenariat').flush({
      partenaire: false, conventionsActives: [], accordsStageEnVigueur: 0, accordsMobiliteEnVigueur: 0, accordsAVenir: 0, reponsesAttendues: 0,
    });
    http.expectOne('/api/partenariats/accords').flush([]);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('invite à demander une convention tant qu’aucune demande n’est en cours', () => {
    const racine = afficher([]);
    expect(racine.querySelector('a[href="/partenariats/demander"]')).not.toBeNull();
    expect(racine.textContent).toContain('Aucune convention pour l’instant');
  });

  it('masque la demande pendant le traitement et signale la convention qui expire', () => {
    const racine = afficher([
      uneConvention(),
      uneConvention({ id: 'c2', statut: 'ACTIVE', dateDebut: '2025-01-01', dateFin: '2026-12-20', joursRestants: 27, expireBientot: true }),
    ]);
    expect(racine.querySelector('a[href="/partenariats/demander"]')).toBeNull();
    expect(racine.textContent).toContain('Prend fin dans 27 jours.');
    expect(racine.querySelector('a[href="/partenariats/conventions/c2"]')).not.toBeNull();
  });
});
