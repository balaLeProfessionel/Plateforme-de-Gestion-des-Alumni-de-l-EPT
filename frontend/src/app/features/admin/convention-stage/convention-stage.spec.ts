import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Convention } from '../../../core/services/models/stage.model';
import { unSuivi } from '../../stages/testing/donnees-stages';
import { ConventionStagePage } from './convention-stage';

const URL = '/api/admin/stages/suivi/s1/convention';

function uneConvention(changement: Partial<Convention> = {}): Convention {
  return {
    stage: unSuivi(), existe: false, assurance: null, indemnite: null, logement: null, clauseConfidentialite: false,
    signeeEtudiantLe: null, signeeOrganismeLe: null, signeeEcoleLe: null, scanNom: null, etat: 'AUCUNE', modifieLe: null,
    ...changement,
  };
}

describe('ConventionStagePage', () => {
  let fixture: ComponentFixture<ConventionStagePage>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConventionStagePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 's1' }) } } }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConventionStagePage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) =>
    [...element().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;

  it('enregistre les clauses saisies', async () => {
    http.expectOne(URL).flush(uneConvention());
    await fixture.whenStable();
    const indemnite = element().querySelector<HTMLInputElement>('#indemnite')!;
    indemnite.value = '100 000 FCFA par mois';
    indemnite.dispatchEvent(new Event('input'));
    bouton('Enregistrer les clauses').click();
    const requete = http.expectOne(URL);
    expect(requete.request.method).toBe('PUT');
    expect(requete.request.body).toEqual({ assurance: '', indemnite: '100 000 FCFA par mois', logement: '', clauseConfidentialite: false });
    requete.flush(uneConvention({ existe: true, indemnite: '100 000 FCFA par mois', etat: 'EN_COURS' }));
    await fixture.whenStable();
    expect(element().querySelector('[role="status"]')?.textContent).toContain('Clauses enregistrées.');
    expect(element().querySelector('.etat-convention')?.textContent).toContain('En cours');
  });

  it('exige une date avant d’enregistrer une signature, puis annonce la convention complète', async () => {
    http.expectOne(URL).flush(uneConvention({ existe: true, signeeEtudiantLe: '2026-01-10', signeeOrganismeLe: '2026-01-12', scanNom: 'convention.pdf', etat: 'EN_COURS' }));
    await fixture.whenStable();
    const ecole = element().querySelectorAll('.signatures li')[2];
    (ecole.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('Indiquez la date de signature (École)');

    const date = ecole.querySelector<HTMLInputElement>('input')!;
    date.value = '2026-01-15';
    date.dispatchEvent(new Event('input'));
    (ecole.querySelector('button') as HTMLButtonElement).click();
    const requete = http.expectOne(`${URL}/signature`);
    expect(requete.request.body).toEqual({ partie: 'ECOLE', date: '2026-01-15' });
    requete.flush(uneConvention({ existe: true, signeeEtudiantLe: '2026-01-10', signeeOrganismeLe: '2026-01-12', signeeEcoleLe: '2026-01-15',
      scanNom: 'convention.pdf', etat: 'COMPLETE' }));
    await fixture.whenStable();
    expect(element().querySelector('[role="status"]')?.textContent).toContain('La convention est complète.');
  });

  it('refuse un scan qui n’est pas un PDF sans appeler le serveur', async () => {
    http.expectOne(URL).flush(uneConvention());
    await fixture.whenStable();
    const champ = element().querySelector<HTMLInputElement>('#scan')!;
    Object.defineProperty(champ, 'files', { value: [new File(['x'], 'scan.png', { type: 'image/png' })] });
    champ.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('La convention signée doit être un fichier PDF.');
  });

  it('génère la convention pré-remplie au nom de l’étudiant', async () => {
    http.expectOne(URL).flush(uneConvention());
    await fixture.whenStable();
    const telecharges: string[] = [];
    const creerUrl = vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:convention');
    const revoquer = vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      telecharges.push(this.download);
    });
    bouton('Générer la convention (.docx)').click();
    const requete = http.expectOne(`${URL}/document`);
    expect(requete.request.responseType).toBe('blob');
    requete.flush(new Blob(['docx']));
    const etudiant = uneConvention().stage.etudiant;
    expect(telecharges).toEqual([`Convention de stage - ${etudiant.prenom} ${etudiant.nom}.docx`]);
    clic.mockRestore();
    creerUrl.mockRestore();
    revoquer.mockRestore();
  });

  it('dit quand la convention n’a pas pu être générée', async () => {
    http.expectOne(URL).flush(uneConvention());
    await fixture.whenStable();
    bouton('Générer la convention (.docx)').click();
    http.expectOne(`${URL}/document`).flush(new Blob(), { status: 500, statusText: 'Erreur' });
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('La convention n’a pas pu être générée.');
  });

  it('signale un stage introuvable', async () => {
    http.expectOne(URL).flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('n’est pas confirmé');
  });
});
