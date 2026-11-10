import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { OffreStage } from '../../../core/services/models/stage.model';
import { authStages, uneOffre } from '../testing/donnees-stages';
import { DetailOffre } from './detail-offre';

describe('DetailOffre', () => {
  let http: HttpTestingController;

  const afficher = (role: string, reponse: OffreStage | null, permissions: string[] = []) => {
    TestBed.configureTestingModule({
      imports: [DetailOffre],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'o1' }) } } },
        { provide: AuthService, useValue: authStages(role, permissions) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(DetailOffre);
    fixture.detectChanges();
    const requete = http.expectOne('/api/stages/offres/o1');
    if (reponse) requete.flush(reponse);
    else requete.flush({ message: 'Offre de stage introuvable' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  afterEach(() => http.verify());

  it('montre l’offre, ses missions et dit à un non-étudiant qu’il ne peut pas postuler', () => {
    const racine = afficher('ALUMNI', uneOffre());
    expect(racine.querySelector('h1')?.textContent).toContain('Développeur web');
    expect(racine.querySelector('.organisme a')?.getAttribute('href')).toBe('/organismes/org1');
    expect(racine.textContent).toContain('Développer le portail client.');
    expect(racine.querySelector('.candidature')?.textContent).toContain('Seuls les étudiants de l’EPT peuvent postuler');
  });

  it('annonce à un étudiant la candidature en ligne, et la fin des candidatures après la date limite', () => {
    expect(afficher('ETUDIANT', uneOffre()).querySelector('.candidature')?.textContent).toContain('sera bientôt disponible');
    TestBed.resetTestingModule();
    expect(afficher('ETUDIANT', uneOffre({ candidaturesOuvertes: false })).querySelector('.candidature')?.textContent)
      .toContain('ne reçoit plus de candidatures');
  });

  it('montre à l’organisme le statut et le motif de l’école', () => {
    const racine = afficher('ORGANISME', uneOffre({ statut: 'REFUSEE', motifDecision: 'Offre d’emploi, pas de stage' }));
    expect(racine.querySelector('.pastille.statut')?.textContent).toBe('Refusée');
    expect(racine.querySelector('.motif')?.textContent).toContain('Offre d’emploi, pas de stage');
  });

  it('dit qu’une offre introuvable n’existe pas ou n’est plus publiée', () => {
    const racine = afficher('ETUDIANT', null);
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('n’existe pas ou n’est plus publiée');
  });
});
