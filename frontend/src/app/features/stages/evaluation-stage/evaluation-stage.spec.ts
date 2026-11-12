import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { afterEach, describe, expect, it } from 'vitest';
import { CritereGrille, Evaluation } from '../../../core/services/models/stage.model';
import { unSuivi } from '../testing/donnees-stages';
import { EvaluationStagePage } from './evaluation-stage';

const GRILLE: CritereGrille[] = [
  { code: 'AUTONOMIE', section: 'TECHNIQUE', libelle: 'Autonomie dans le travail' },
  { code: 'PONCTUALITE', section: 'PERSONNELLE', libelle: 'Ponctualité et assiduité' },
];

function uneEvaluation(changement: Partial<Evaluation> = {}): Evaluation {
  return {
    stage: unSuivi({ convention: 'COMPLETE' }), grille: GRILLE, criteres: {}, dureeEffectiveMois: null, pointsForts: null,
    axesAmelioration: null, observations: null, appreciationGenerale: null, avisTuteurValide: null, etat: 'AUCUNE',
    saisieParEcole: false, soumiseLe: null, stageValide: null, decideLe: null, modifiable: true, ...changement,
  };
}

describe('EvaluationStagePage', () => {
  let fixture: ComponentFixture<EvaluationStagePage>;
  let http: HttpTestingController;

  function creer(ecole: boolean): void {
    TestBed.configureTestingModule({
      imports: [EvaluationStagePage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 's1' }), data: { ecole } } } }],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EvaluationStagePage);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  const element = () => fixture.nativeElement as HTMLElement;
  const bouton = (texte: string) =>
    [...element().querySelectorAll('button')].find((b) => b.textContent?.trim() === texte) as HTMLButtonElement;
  const cocher = (nom: string, index: number) => {
    const radio = element().querySelectorAll<HTMLInputElement>(`input[name="${nom}"]`)[index];
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
  };

  it('refuse de remettre une fiche incomplète, puis la remet après confirmation', async () => {
    creer(false);
    http.expectOne('/api/stages/suivi/s1/evaluation').flush(uneEvaluation());
    await fixture.whenStable();
    expect(element().querySelectorAll('section h2')[0].textContent).toContain('Compétences techniques');

    cocher('AUTONOMIE', 0);
    bouton('Remettre l’évaluation').click();
    await fixture.whenStable();
    expect(element().querySelector('[role="alert"]')?.textContent).toContain('1 sans réponse');

    cocher('PONCTUALITE', 1);
    const duree = element().querySelector<HTMLInputElement>('#duree')!;
    duree.value = '4.5';
    duree.dispatchEvent(new Event('input'));
    cocher('appreciation', 0);
    cocher('avis', 0);
    bouton('Remettre l’évaluation').click();
    await fixture.whenStable();
    bouton('Confirmer la remise').click();
    const requete = http.expectOne('/api/stages/suivi/s1/evaluation/soumettre');
    expect(requete.request.body).toMatchObject({
      criteres: { AUTONOMIE: 'TRES_SATISFAISANT', PONCTUALITE: 'SATISFAISANT' }, dureeEffectiveMois: 4.5,
      appreciationGenerale: 'TRES_SATISFAISANT', avisTuteurValide: true,
    });
    requete.flush(uneEvaluation({ etat: 'SOUMISE', modifiable: false, soumiseLe: '2026-07-02T10:00:00Z',
      criteres: { AUTONOMIE: 'TRES_SATISFAISANT', PONCTUALITE: 'SATISFAISANT' } }));
    await fixture.whenStable();
    expect(element().querySelector('[role="status"]')?.textContent).toContain('remise à l’école');
    expect(element().querySelector<HTMLInputElement>('#duree')!.disabled).toBe(true);
    expect(bouton('Remettre l’évaluation')).toBeUndefined();
  });

  it('permet à l’école de décider de la validation d’une évaluation remise', async () => {
    creer(true);
    http.expectOne('/api/admin/stages/suivi/s1/evaluation').flush(uneEvaluation({ etat: 'SOUMISE', modifiable: false, avisTuteurValide: true }));
    await fixture.whenStable();
    bouton('Valider le stage').click();
    const requete = http.expectOne('/api/admin/stages/suivi/s1/evaluation/decision');
    expect(requete.request.body).toEqual({ valide: true });
    requete.flush(uneEvaluation({ etat: 'SOUMISE', modifiable: false, stageValide: true, decideLe: '2026-07-03T10:00:00Z' }));
    await fixture.whenStable();
    expect(element().textContent).toContain('Stage validé');
    expect(bouton('Valider le stage').getAttribute('aria-pressed')).toBe('true');
  });

  it('annonce l’attente de la convention', async () => {
    creer(false);
    http.expectOne('/api/stages/suivi/s1/evaluation').flush(uneEvaluation({ stage: unSuivi(), modifiable: false }));
    await fixture.whenStable();
    expect(element().textContent).toContain('quand la convention sera complète');
  });
});
