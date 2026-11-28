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
    const lignes = racine.querySelectorAll('.carte');
    expect(lignes.length).toBe(2);
    expect(lignes[0].classList).toContain('carte-cliquable');
    expect(lignes[0].querySelector('a.lien-etire')?.getAttribute('href')).toBe('/offres-emploi/g1');
    expect(lignes[0].querySelector('.statut')?.textContent).toContain('Entretien');
    expect(lignes[1].textContent).toContain('Offre expirée');
    expect(lignes[1].querySelector('.statut')?.textContent).toContain('Retirée');
  });

  it('range les candidatures en cours avant les terminées', () => {
    const racine = afficher();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush([
      uneCandidatureEmploi({ id: 'c1', titreOffre: 'Close', statut: 'RETENUE', statutsAtteints: ['RECUE', 'PRESELECTIONNEE', 'ENTRETIEN', 'RETENUE'] }),
      uneCandidatureEmploi({ id: 'c2', titreOffre: 'Ouverte', statut: 'RECUE' }),
    ]);
    fixture.detectChanges();
    const sections = [...racine.querySelectorAll('section')];
    expect(sections.map((s) => s.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['En cours 1', 'Terminées 1']);
    expect(sections[0].textContent).toContain('Ouverte');
    expect(sections[1].textContent).toContain('Close');
  });

  it('ne remplit pas le segment d’une étape sautée par le recruteur', () => {
    const racine = afficher();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush([
      uneCandidatureEmploi({ statut: 'NON_RETENUE', statutsAtteints: ['RECUE', 'NON_RETENUE'] }),
    ]);
    fixture.detectChanges();
    const segments = [...racine.querySelectorAll('.avancement li')].map((li) => li.className);
    expect(segments).toEqual(['faite', 'vide', 'vide', 'refusee']);
  });

  it('compte l’envoi d’une candidature antérieure à l’historique', () => {
    const racine = afficher();
    http.expectOne('/api/offres-emploi/mes-candidatures').flush([uneCandidatureEmploi({ statut: 'RECUE', statutsAtteints: [] })]);
    fixture.detectChanges();
    expect(racine.querySelector('.avancement li')?.className).toBe('faite');
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
