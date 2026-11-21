import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { EtatConvention, EtatEvaluation } from '../../../core/services/models/stage.model';
import { EtapesStage } from './etapes-stage';

describe('EtapesStage', () => {
  const afficher = (convention: EtatConvention | null, evaluation: EtatEvaluation | null, stageValide: boolean | null) => {
    const fixture = TestBed.createComponent(EtapesStage);
    fixture.componentRef.setInput('convention', convention);
    fixture.componentRef.setInput('evaluation', evaluation);
    fixture.componentRef.setInput('stageValide', stageValide);
    fixture.detectChanges();
    const etapes = [...(fixture.nativeElement as HTMLElement).querySelectorAll('li')];
    return etapes.map((li) => ({ texte: li.textContent?.replace(/\s+/g, ' ').trim(), avancement: li.dataset['avancement'], courante: li.getAttribute('aria-current') }));
  };

  it('signale la convention comme étape en cours tant qu’elle n’est pas signée', () => {
    const etapes = afficher('EN_COURS', 'AUCUNE', null);
    expect(etapes.map((e) => e.texte)).toEqual(['Convention signatures en cours', 'Évaluation après la convention', 'Décision de l’école à venir']);
    expect(etapes.map((e) => e.courante)).toEqual(['step', null, null]);
  });

  it('attend la décision une fois l’évaluation remise, puis marque le stage non validé', () => {
    expect(afficher('COMPLETE', 'SOUMISE', null).map((e) => e.avancement)).toEqual(['fait', 'fait', 'en-cours']);
    expect(afficher('COMPLETE', 'SOUMISE', false)[2]).toEqual({ texte: 'Décision de l’école stage non validé', avancement: 'refuse', courante: null });
  });

  it('omet l’évaluation pour l’étudiant, qui ne la voit pas', () => {
    expect(afficher('COMPLETE', null, true).map((e) => e.texte)).toEqual(['Convention signée et déposée', 'Décision de l’école stage validé']);
  });
});
