import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MaCandidature } from '../../../core/services/models/stage.model';
import { MesCandidatures } from './mes-candidatures';

describe('MesCandidatures', () => {
  let http: HttpTestingController;

  const afficher = (liste: MaCandidature[]) => {
    TestBed.configureTestingModule({ imports: [MesCandidatures], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MesCandidatures);
    fixture.detectChanges();
    http.expectOne('/api/stages/mes-candidatures').flush(liste);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('liste les candidatures avec leur état et propose de renvoyer une candidature retirée', () => {
    const racine = afficher([{
      id: 'c1', offreId: 'o1', titreOffre: 'Développeur web', organisme: 'Kër Data', dateLimiteCandidature: '2026-12-15',
      candidaturesOuvertes: true, statut: 'RETIREE', lettreMotivation: null, nomCv: 'cv.pdf',
      envoyeeLe: '2026-11-10T10:00:00Z', retireeLe: '2026-11-11T10:00:00Z', resultat: null,
    }]);
    expect(racine.querySelector('.ligne a')?.getAttribute('href')).toBe('/stages/offres/o1');
    expect(racine.querySelector('.statut')?.textContent).toBe('Retirée');
    expect(racine.textContent).toContain('Vous pouvez la renvoyer jusqu’au');
  });

  it('invite à parcourir les offres', () => {
    expect(afficher([]).querySelector('.etat a')?.getAttribute('href')).toBe('/stages');
  });

  it('remplace l’état par le résultat une fois la liste définitive publiée', () => {
    const racine = afficher([{
      id: 'c1', offreId: 'o1', titreOffre: 'Développeur web', organisme: 'Kër Data', dateLimiteCandidature: '2026-12-15',
      candidaturesOuvertes: false, statut: 'ENVOYEE', lettreMotivation: null, nomCv: 'cv.pdf',
      envoyeeLe: '2026-11-10T10:00:00Z', retireeLe: null, resultat: 'NON_RETENUE',
    }]);
    expect(racine.querySelector('.statut')?.textContent).toBe('Non retenue');
    expect(racine.querySelector('a[href="/stages/mes-stages"]')).not.toBeNull();
  });
});
