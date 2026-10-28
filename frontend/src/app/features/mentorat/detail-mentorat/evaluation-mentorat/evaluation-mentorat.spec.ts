import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationMentorat } from '../../../../core/services/models/mentorat.model';
import { saisir, soumettre } from '../../testing/donnees-mentorat';
import { EvaluationMentoratCarte } from './evaluation-mentorat';

describe('EvaluationMentoratCarte', () => {
  let fixture: ComponentFixture<EvaluationMentoratCarte>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  function afficher(options: { evaluations?: EvaluationMentorat[]; peutEvaluer?: boolean; termine?: boolean }): void {
    fixture.componentRef.setInput('mentoratId', 'm1');
    fixture.componentRef.setInput('moi', 'u2');
    fixture.componentRef.setInput('evaluations', options.evaluations ?? []);
    fixture.componentRef.setInput('peutEvaluer', options.peutEvaluer ?? false);
    fixture.componentRef.setInput('termine', options.termine ?? false);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EvaluationMentoratCarte],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EvaluationMentoratCarte);
    racine = fixture.nativeElement;
  });

  afterEach(() => http.verify());

  const evaluation = (auteurId: string, note: number, commentaire: string | null = null): EvaluationMentorat =>
    ({ id: auteurId, auteurId, note, commentaire, creeLe: '2026-10-21T10:00:00Z' });

  it('annonce que l’évaluation viendra à la clôture', () => {
    afficher({});
    expect(racine.textContent).toContain('Disponible à la clôture du mentorat.');
    expect(racine.querySelector('form')).toBeNull();
  });

  it('exige une note avant d’envoyer', async () => {
    afficher({ peutEvaluer: true, termine: true });
    expect(racine.querySelectorAll('input[type="radio"]')).toHaveLength(5);
    soumettre(racine.querySelector('form') as HTMLFormElement);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(racine.querySelector('#erreur-note')?.textContent).toContain('note de 1 à 5');
    http.expectNone('/api/mentorat/mentorats/m1/evaluation');
  });

  it('envoie la note et le commentaire nettoyé', async () => {
    let evaluee = 0;
    fixture.componentInstance.evaluee.subscribe(() => evaluee++);
    afficher({ peutEvaluer: true, termine: true });
    const etoiles = [...racine.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
    etoiles[3].dispatchEvent(new Event('change'));
    saisir(racine.querySelector('textarea') as HTMLTextAreaElement, '  Très utile  ');
    fixture.detectChanges();
    expect(racine.querySelectorAll('.etoiles label.allumee')).toHaveLength(4);

    soumettre(racine.querySelector('form') as HTMLFormElement);
    await fixture.whenStable();
    const requete = http.expectOne('/api/mentorat/mentorats/m1/evaluation');
    expect(requete.request.body).toEqual({ note: 4, commentaire: 'Très utile' });
    requete.flush(evaluation('u2', 4, 'Très utile'));
    await fixture.whenStable();
    expect(evaluee).toBe(1);
  });

  it('montre ma note et signale celle de l’autre participant', () => {
    afficher({ evaluations: [evaluation('u2', 3, 'Bien'), evaluation('u1', 5)], termine: true });
    expect(racine.querySelector('.note')?.getAttribute('aria-label')).toBe('Votre note : 3 sur 5');
    expect(racine.querySelectorAll('.note .pi-star-fill')).toHaveLength(3);
    expect(racine.querySelector('blockquote')?.textContent).toContain('Bien');
    expect(racine.textContent).toContain('L’autre participant a aussi évalué ce mentorat.');
  });

  it('dit qu’un mentorat clos sans évaluation possible ne s’évalue pas', () => {
    afficher({ termine: true });
    expect(racine.textContent).toContain('Évaluation indisponible.');
  });
});
