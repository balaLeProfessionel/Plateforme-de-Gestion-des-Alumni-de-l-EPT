import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { CandidatureRecue } from '../../../core/services/models/stage.model';
import { uneOffre } from '../testing/donnees-stages';
import { CandidaturesRecues } from './candidatures-recues';

describe('CandidaturesRecues', () => {
  let fixture: ComponentFixture<CandidaturesRecues>;
  let http: HttpTestingController;
  const awa: CandidatureRecue = {
    id: 'c1', etudiant: { id: 'e1', prenom: 'Awa', nom: 'Diop', filiere: 'Génie Civil', anneeEntree: 2023, urlPhoto: null },
    email: null, statut: 'ENVOYEE', avisOrganisme: 'EN_ATTENTE', lettreMotivation: 'Motivée.', nomCv: 'CV Awa.pdf',
    envoyeeLe: '2026-11-10T10:00:00Z', avisDonneLe: null,
  };

  const afficher = (administration: boolean, liste: CandidatureRecue[]) => {
    TestBed.configureTestingModule({
      imports: [CandidaturesRecues],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'o1' }), data: { administration } } } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidaturesRecues);
    fixture.detectChanges();
    http.expectOne('/api/stages/offres/o1').flush(uneOffre());
    http.expectOne('/api/stages/offres/o1/candidatures').flush(liste);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('.avis button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('montre à l’organisme les candidats sans e-mail et enregistre son avis', () => {
    const racine = afficher(false, [awa]);
    expect(racine.querySelector('h2')?.textContent).toContain('Awa Diop');
    expect(racine.querySelector('.details')?.textContent).toContain('Génie Civil · entrée en 2023');
    expect(racine.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(bouton(racine, 'Sans avis').getAttribute('aria-pressed')).toBe('true');

    bouton(racine, 'Retenue').click();
    const requete = http.expectOne({ method: 'PATCH', url: '/api/stages/candidatures/c1/avis' });
    expect(requete.request.body).toEqual({ avis: 'RETENUE' });
    requete.flush({ ...awa, avisOrganisme: 'RETENUE', avisDonneLe: '2026-11-11T10:00:00Z' });
    fixture.detectChanges();
    expect(bouton(racine, 'Retenue').getAttribute('aria-pressed')).toBe('true');
    expect(racine.querySelector('.resume')?.textContent).toContain('dont 1 retenue');
  });

  it('montre à l’école les retirées, l’e-mail et l’avis de l’organisme, sans le modifier', () => {
    const racine = afficher(true, [
      { ...awa, email: 'awa@ept.sn', avisOrganisme: 'NON_RETENUE', avisDonneLe: '2026-11-11T10:00:00Z' },
      { ...awa, id: 'c2', statut: 'RETIREE' },
    ]);
    expect(racine.querySelector('a[href="mailto:awa@ept.sn"]')).not.toBeNull();
    expect(racine.querySelector('.avis-lu')?.textContent).toContain('Non retenue');
    expect(racine.querySelector('.avis')).toBeNull();
    expect([...racine.querySelectorAll('.statut')].map((s) => s.textContent)).toEqual(['Envoyée', 'Retirée']);
  });

  it('télécharge le CV avec le jeton', () => {
    const racine = afficher(false, [awa]);
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    (racine.querySelector('.lien-cv') as HTMLButtonElement).click();
    http.expectOne('/api/stages/candidatures/c1/cv').flush(new Blob(['%PDF-']));
    expect(clic).toHaveBeenCalled();
    clic.mockRestore();
  });
});
