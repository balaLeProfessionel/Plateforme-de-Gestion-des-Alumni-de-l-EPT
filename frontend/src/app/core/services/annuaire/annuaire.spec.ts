import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AnnuaireService } from './annuaire';

describe('AnnuaireService', () => {
  let service: AnnuaireService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AnnuaireService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('construit les paramètres HTTP et ignore les filtres vides', () => {
    service.rechercher({
      recherche: '  awa ',
      role: 'ETUDIANT',
      filiere: '',
      promotion: '2025',
      ville: ' Thiès ',
      tri: 'PROMOTION_DESC',
      page: 2,
      taille: 12
    }).subscribe();

    const requete = http.expectOne((req) => req.url === '/api/annuaire');
    expect(requete.request.params.get('recherche')).toBe('awa');
    expect(requete.request.params.get('role')).toBe('ETUDIANT');
    expect(requete.request.params.has('filiere')).toBe(false);
    expect(requete.request.params.get('promotion')).toBe('2025');
    expect(requete.request.params.get('ville')).toBe('Thiès');
    expect(requete.request.params.get('tri')).toBe('PROMOTION_DESC');
    expect(requete.request.params.get('page')).toBe('2');
    expect(requete.request.params.get('taille')).toBe('12');
    requete.flush({ contenu: [], page: 2, taille: 12, totalElements: 0, totalPages: 0 });
  });
});
