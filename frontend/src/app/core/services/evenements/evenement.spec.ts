import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { EvenementService } from './evenement';

describe('EvenementService', () => {
  let service: EvenementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EvenementService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envoie la période et la pagination demandées', () => {
    service.lister('PASSES', 2, 24).subscribe();

    const requete = http.expectOne('/api/evenements?periode=PASSES&page=2&taille=24');
    expect(requete.request.method).toBe('GET');
    requete.flush({ contenu: [], page: 2, taille: 24, totalElements: 0, totalPages: 0 });
  });

  it('encode l’identifiant de l’événement dans la requête de détail', () => {
    service.obtenir('event id/1').subscribe();

    const requete = http.expectOne('/api/evenements/event%20id%2F1');
    expect(requete.request.method).toBe('GET');
    requete.flush({});
  });
});
