import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { unAccord } from '../testing/donnees-partenariat';
import { MesAccords } from './mes-accords';

describe('MesAccords', () => {
  it('place en tête les accords qui attendent la réponse de l’organisme', () => {
    TestBed.configureTestingModule({ imports: [MesAccords], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MesAccords);
    fixture.detectChanges();
    http.expectOne('/api/partenariats/accords').flush([
      unAccord({ id: 'a2', objet: 'Échanges', statut: 'ACTIF', aRepondre: false }),
      unAccord({ id: 'a1' }),
    ]);
    fixture.detectChanges();
    const liens = [...(fixture.nativeElement as HTMLElement).querySelectorAll('h3 a')].map((a) => a.getAttribute('href'));
    expect(liens).toEqual(['/partenariats/accords/a1', '/partenariats/accords/a2']);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('votre réponse est attendue');
    http.verify();
  });
});
