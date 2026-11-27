import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { uneCandidatureEmploi } from '../testing/donnees-offres-emploi';
import { MesCandidaturesEmploi } from './mes-candidatures-emploi';

describe('MesCandidaturesEmploi', () => {
  let fixture: ComponentFixture<MesCandidaturesEmploi>;
  let http: HttpTestingController;

  const afficher = () => {
    TestBed.configureTestingModule({
      imports: [MesCandidaturesEmploi],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MesCandidaturesEmploi);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('liste les candidatures avec leur statut et un lien vers l’offre', () => {
    const racine = afficher();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush([
      uneCandidatureEmploi({ statut: 'ENTRETIEN' }),
      uneCandidatureEmploi({ id: 'c2', offreId: 'g2', titreOffre: 'Analyste données', offreExpiree: true, statut: 'RETIREE' }),
    ]);
    fixture.detectChanges();
    const lignes = racine.querySelectorAll('.ligne');
    expect(lignes.length).toBe(2);
    expect(lignes[0].querySelector('a')?.getAttribute('href')).toBe('/offres-emploi/g1');
    expect(lignes[0].querySelector('.statut')?.textContent).toContain('Entretien');
    expect(lignes[1].textContent).toContain('offre expirée');
    expect(lignes[1].querySelector('.statut')?.textContent).toContain('Retirée');
  });

  it('invite à parcourir les offres quand il n’y a aucune candidature', () => {
    const racine = afficher();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush([]);
    fixture.detectChanges();
    expect(racine.querySelector('h2')?.textContent).toContain('Aucune candidature pour l’instant');
  });

  it('propose de réessayer après un échec de chargement', () => {
    const racine = afficher();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush(null, { status: 500, statusText: 'Erreur' });
    fixture.detectChanges();
    (racine.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush([]);
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')).toBeNull();
  });
});
