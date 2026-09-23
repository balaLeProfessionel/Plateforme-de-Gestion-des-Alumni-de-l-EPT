import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ProfilService } from './profil-service';

describe('ProfilService', () => {
  let service: ProfilService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProfilService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envoie la photo avec le nom multipart attendu', () => {
    const fichier = new File(['image'], 'profil.png', { type: 'image/png' });
    service.modifierPhoto(fichier).subscribe();

    const requete = http.expectOne('/api/profil/me/photo');
    expect(requete.request.method).toBe('POST');
    expect(requete.request.body).toBeInstanceOf(FormData);
    expect((requete.request.body as FormData).get('photo')).toBe(fichier);
    requete.flush({});
  });

  it('supprime la photo du profil', () => {
    service.supprimerPhoto().subscribe();
    const requete = http.expectOne('/api/profil/me/photo');
    expect(requete.request.method).toBe('DELETE');
    requete.flush({});
  });
});
