import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MaCandidature, OffreStage } from '../../../core/services/models/stage.model';
import { uneOffre } from '../testing/donnees-stages';
import { CandidatureOffre } from './candidature-offre';

describe('CandidatureOffre', () => {
  let fixture: ComponentFixture<CandidatureOffre>;
  let http: HttpTestingController;
  const envoyee: MaCandidature = {
    id: 'c1', offreId: 'o1', titreOffre: 'Développeur web', organisme: 'Kër Data', dateLimiteCandidature: '2026-12-15',
    candidaturesOuvertes: true, statut: 'ENVOYEE', lettreMotivation: 'Motivée.', nomCv: 'CV Awa.pdf',
    envoyeeLe: '2026-11-10T10:00:00Z', retireeLe: null, resultat: null,
  };

  const afficher = (existante: MaCandidature | null, offre: OffreStage = uneOffre()) => {
    TestBed.configureTestingModule({ imports: [CandidatureOffre], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidatureOffre);
    fixture.componentRef.setInput('offre', offre);
    fixture.detectChanges();
    const requete = http.expectOne('/api/stages/offres/o1/ma-candidature');
    if (existante) requete.flush(existante);
    else requete.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const choisirCv = (racine: HTMLElement, fichier: File) => {
    const champ = racine.querySelector('#candidature-cv') as HTMLInputElement;
    Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
    champ.dispatchEvent(new Event('change'));
  };
  const soumettre = (racine: HTMLElement) => {
    racine.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  afterEach(() => http.verify());

  it('exige un CV PDF puis envoie la candidature avec la lettre', () => {
    const racine = afficher(null);
    soumettre(racine);
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Joignez votre CV en PDF.');
    choisirCv(racine, new File(['x'], 'cv.docx', { type: 'application/msword' }));
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('doit être un fichier PDF');

    choisirCv(racine, new File(['%PDF-'], 'CV Awa.pdf', { type: 'application/pdf' }));
    const lettre = racine.querySelector('#candidature-lettre') as HTMLTextAreaElement;
    lettre.value = 'Motivée.';
    lettre.dispatchEvent(new Event('input'));
    soumettre(racine);
    const requete = http.expectOne({ method: 'POST', url: '/api/stages/offres/o1/candidature' });
    const corps = requete.request.body as FormData;
    expect((corps.get('cv') as File).name).toBe('CV Awa.pdf');
    expect(corps.get('lettre')).toBe('Motivée.');
    requete.flush(envoyee);
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Votre candidature est envoyée.');
    expect(racine.querySelector('form')).toBeNull();
    expect(racine.textContent).toContain('Candidature envoyée le');
  });

  it('retire une candidature envoyée après confirmation, puis la renvoie sans nouveau CV', () => {
    const racine = afficher(envoyee);
    bouton(racine, 'Retirer ma candidature').click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')?.textContent).toContain('L’organisme ne la verra plus.');
    ([...racine.querySelectorAll('.confirmation button')][0] as HTMLButtonElement).click();
    http.expectOne({ method: 'PATCH', url: '/api/stages/offres/o1/candidature/retirer' })
      .flush({ ...envoyee, statut: 'RETIREE', retireeLe: '2026-11-11T10:00:00Z' });
    fixture.detectChanges();
    expect(racine.textContent).toContain('Vous avez retiré votre candidature');
    expect(racine.querySelector('#aide-cv')?.textContent).toContain('« CV Awa.pdf » est gardé');

    soumettre(racine);
    const renvoi = http.expectOne({ method: 'POST', url: '/api/stages/offres/o1/candidature' });
    expect((renvoi.request.body as FormData).get('cv')).toBeNull();
    renvoi.flush(envoyee);
  });

  it('dit que la date limite est passée et ne propose pas de formulaire', () => {
    const racine = afficher(null, uneOffre({ candidaturesOuvertes: false }));
    expect(racine.textContent).toContain('La date limite est passée');
    expect(racine.querySelector('form')).toBeNull();
  });

  it('affiche le résultat de la liste publiée et ne propose plus de retirer la candidature', () => {
    const racine = afficher({ ...envoyee, resultat: 'RETENUE' }, uneOffre({ statut: 'LISTE_PUBLIEE', candidaturesOuvertes: false }));
    expect(racine.querySelector('.resultat.retenue')?.textContent).toContain('retenu votre candidature');
    expect(racine.querySelector('.resultat a')?.getAttribute('href')).toBe('/stages/mes-stages');
    expect(bouton(racine, 'Retirer ma candidature')).toBeUndefined();
    expect(racine.querySelector('form')).toBeNull();
  });

  it('annonce une candidature non retenue', () => {
    const racine = afficher({ ...envoyee, resultat: 'NON_RETENUE' }, uneOffre({ statut: 'LISTE_PUBLIEE', candidaturesOuvertes: false }));
    expect(racine.querySelector('.resultat')?.textContent).toContain('n’a pas été retenue');
  });
});
