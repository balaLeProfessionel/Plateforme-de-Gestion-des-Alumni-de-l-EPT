import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DernierCv, MaCandidatureEmploi, OffreEmploi } from '../../../core/services/models/offre-emploi.model';
import { uneCandidatureEmploi, uneOffreGeree } from '../testing/donnees-offres-emploi';
import { CandidatureOffreEmploi } from './candidature-offre-emploi';

describe('CandidatureOffreEmploi', () => {
  let fixture: ComponentFixture<CandidatureOffreEmploi>;
  let http: HttpTestingController;

  const afficher = (offre: OffreEmploi = uneOffreGeree(), existante: MaCandidatureEmploi | null = null, dernierCv: DernierCv | null = null) => {
    TestBed.configureTestingModule({
      imports: [CandidatureOffreEmploi],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CandidatureOffreEmploi);
    fixture.componentRef.setInput('offre', offre);
    fixture.detectChanges();
    const candidature = http.expectOne(`/api/offres-emploi/${offre.id}/ma-candidature`);
    if (existante) candidature.flush(existante);
    else candidature.flush(null, { status: 204, statusText: 'No Content' });
    const cv = http.expectOne('/api/offres-emploi/mon-dernier-cv');
    if (dernierCv) cv.flush(dernierCv);
    else cv.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };
  const choisirCv = (racine: HTMLElement, fichier: File) => {
    const champ = racine.querySelector('#candidature-cv') as HTMLInputElement;
    Object.defineProperty(champ, 'files', { value: [fichier], configurable: true });
    champ.dispatchEvent(new Event('change'));
  };
  const saisir = (racine: HTMLElement, selecteur: string, valeur: string) => {
    const champ = racine.querySelector(selecteur) as HTMLTextAreaElement;
    champ.value = valeur;
    champ.dispatchEvent(new Event('input'));
  };
  const soumettre = async (racine: HTMLElement) => {
    racine.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const bouton = (racine: HTMLElement, texte: string) =>
    [...racine.querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const lireReponses = (corps: FormData) => (corps.get('reponses') as Blob).text().then((texte) => JSON.parse(texte));

  afterEach(() => http.verify());

  it('dit qui verra la candidature, exige un CV PDF puis l’envoie', async () => {
    const racine = afficher();
    expect(racine.querySelector('.destinataire')?.textContent).toContain('Votre candidature sera vue par Sonatel');
    await soumettre(racine);
    expect(racine.querySelector('#erreur-cv')?.textContent).toContain('Joignez votre CV en PDF.');

    choisirCv(racine, new File(['x'], 'cv.docx', { type: 'application/msword' }));
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-cv')?.textContent).toContain('doit être un fichier PDF');

    choisirCv(racine, new File(['%PDF-'], 'cv-awa.pdf', { type: 'application/pdf' }));
    await soumettre(racine);
    const requete = http.expectOne({ method: 'POST', url: '/api/offres-emploi/g1/candidature' });
    const corps = requete.request.body as FormData;
    expect((corps.get('cv') as File).name).toBe('cv-awa.pdf');
    expect(corps.get('lettre')).toBeNull();
    requete.flush(uneCandidatureEmploi());
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('[role="status"]')?.textContent).toContain('Votre candidature est envoyée.');
    expect(racine.querySelector('form')).toBeNull();
    expect(racine.textContent).toContain('Candidature envoyée le');
  });

  it('bloque l’envoi tant que la lettre exigée et les questions obligatoires manquent, puis envoie les réponses', async () => {
    const racine = afficher(uneOffreGeree({
      lettreExigee: true,
      questions: [
        { id: 'q1', intitule: 'Votre disponibilité ?', type: 'TEXTE', obligatoire: true },
        { id: 'q2', intitule: 'Permis de conduire ?', type: 'OUI_NON', obligatoire: true },
        { id: 'q3', intitule: 'Un portfolio ?', type: 'TEXTE', obligatoire: false },
      ],
    }), null, { nomCv: 'ancien.pdf', envoyeLe: '2026-10-01T10:00:00' });
    expect(racine.textContent).toContain('Reprendre « ancien.pdf »');
    expect(racine.querySelector('label[for="question-2"]')?.textContent).toContain('(facultatif)');

    await soumettre(racine);
    expect(racine.querySelector('#erreur-lettre')?.textContent).toContain('Cette offre exige une lettre de motivation.');
    expect(racine.querySelector('#erreur-question-0')?.textContent).toContain('Répondez à cette question.');
    expect(racine.querySelector('#erreur-question-1')?.textContent).toContain('Répondez à cette question.');
    expect(racine.querySelector('#question-0')?.getAttribute('aria-invalid')).toBe('true');
    expect(racine.querySelector('#question-1')?.getAttribute('aria-invalid')).toBe('true');
    http.expectNone('/api/offres-emploi/g1/candidature');

    saisir(racine, '#question-0', 'Dès janvier');
    (racine.querySelector('#question-1') as HTMLInputElement).dispatchEvent(new Event('change'));
    saisir(racine, '#candidature-lettre', 'Je suis motivée.');
    fixture.detectChanges();
    await soumettre(racine);
    const requete = http.expectOne({ method: 'POST', url: '/api/offres-emploi/g1/candidature' });
    const corps = requete.request.body as FormData;
    expect(corps.get('cv')).toBeNull();
    expect(corps.get('reprendreCv')).toBe('true');
    expect(corps.get('lettre')).toBe('Je suis motivée.');
    expect(await lireReponses(corps)).toEqual([{ questionId: 'q1', valeur: 'Dès janvier' }, { questionId: 'q2', valeur: 'OUI' }]);
    requete.flush({ message: 'Vous avez déjà postulé à cette offre.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('.message-erreur')?.textContent).toContain('Vous avez déjà postulé à cette offre.');
  });

  it('montre le statut d’une candidature reçue et la retire après confirmation', () => {
    const racine = afficher(uneOffreGeree(), uneCandidatureEmploi({ lettreMotivation: 'Motivée.' }));
    expect(racine.querySelector('.statut')?.textContent).toContain('Reçue');
    expect(racine.querySelector('form')).toBeNull();
    expect(racine.querySelector('details')?.textContent).toContain('Motivée.');

    bouton(racine, 'Retirer ma candidature').click();
    fixture.detectChanges();
    expect(racine.querySelector('.confirmation')?.textContent).toContain('Le recruteur ne la verra plus.');
    ([...racine.querySelectorAll('.confirmation button')][0] as HTMLButtonElement).click();
    http.expectOne({ method: 'PATCH', url: '/api/offres-emploi/g1/candidature/retirer' })
      .flush(uneCandidatureEmploi({ statut: 'RETIREE', retireeLe: '2026-11-26T10:00:00', retirable: false }));
    fixture.detectChanges();
    expect(racine.textContent).toContain('Vous avez retiré votre candidature');
    expect(racine.textContent).toContain('Garder « cv-awa.pdf »');
    expect(bouton(racine, 'Renvoyer ma candidature')).toBeTruthy();
  });

  it('ne propose plus de retrait ni d’envoi quand le recruteur a traité la candidature', () => {
    const racine = afficher(uneOffreGeree(), uneCandidatureEmploi({ statut: 'ENTRETIEN', retirable: false }));
    expect(racine.querySelector('.statut')?.textContent?.trim()).toBeTruthy();
    expect(bouton(racine, 'Retirer ma candidature')).toBeUndefined();
    expect(racine.querySelector('form')).toBeNull();
  });

  it('n’ouvre pas le formulaire sur une offre expirée', () => {
    const racine = afficher(uneOffreGeree({ expiree: true }));
    expect(racine.textContent).toContain('ne reçoit plus de candidatures');
    expect(racine.querySelector('form')).toBeNull();
  });

  it('n’ouvre pas le formulaire quand le recrutement est clôturé', () => {
    const racine = afficher(uneOffreGeree({ cloturee: true }));
    expect(racine.textContent).toContain('Le recrutement est clôturé');
    expect(racine.querySelector('form')).toBeNull();
  });
});
