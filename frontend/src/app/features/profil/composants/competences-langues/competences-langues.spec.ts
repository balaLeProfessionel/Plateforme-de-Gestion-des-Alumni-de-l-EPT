import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CompetencesLanguesEditeur } from './competences-langues';

describe('CompetencesLanguesEditeur', () => {
  let fixture: ComponentFixture<CompetencesLanguesEditeur>;
  let composant: CompetencesLanguesEditeur;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CompetencesLanguesEditeur] });
    fixture = TestBed.createComponent(CompetencesLanguesEditeur);
    composant = fixture.componentInstance;
    fixture.componentRef.setInput('valeur', {
      competences: ['Java'],
      langues: [{ code: 'fr', niveau: 'MATERNELLE' }]
    });
    fixture.detectChanges();
  });

  it('ajoute ce que le CV apporte sans doublon ni retrait', () => {
    fixture.componentRef.setInput('prerempli', {
      competences: ['java', 'Angular'],
      langues: [{ code: 'fr', niveau: 'COURANT' }, { code: 'en', niveau: null }]
    });
    fixture.detectChanges();

    expect(composant['competences']()).toEqual(['Java', 'Angular']);
    expect(composant['langues']().map((l) => [l.code, l.niveau])).toEqual([
      ['fr', 'MATERNELLE'],
      ['en', '']
    ]);
  });

  it('refuse une compétence déjà présente, même écrite autrement', () => {
    composant['saisie'].set('JAVA ');
    composant['ajouterCompetence']();
    expect(composant['erreurCompetence']()).toContain('déjà');
    expect(composant['competences']()).toEqual(['Java']);
  });

  it('demande un niveau pour chaque langue avant d enregistrer', () => {
    const sauvegarde = vi.spyOn(composant.sauvegarder, 'emit');
    composant['ajouterLangue']();
    const ligne = composant['langues']().at(-1)!;
    composant['majLangue'](ligne.cle, 'code', 'en');

    expect(composant.valider()).toBe(false);
    expect(sauvegarde).not.toHaveBeenCalled();

    composant['majLangue'](ligne.cle, 'niveau', 'COURANT');
    expect(composant.valider()).toBe(true);
    expect(sauvegarde).toHaveBeenCalledWith({
      competences: ['Java'],
      langues: [{ code: 'fr', niveau: 'MATERNELLE' }, { code: 'en', niveau: 'COURANT' }]
    });
  });

  it('refuse la même langue deux fois', () => {
    composant['ajouterLangue']();
    const ligne = composant['langues']().at(-1)!;
    composant['majLangue'](ligne.cle, 'code', 'fr');
    composant['majLangue'](ligne.cle, 'niveau', 'COURANT');

    expect(composant.valider()).toBe(false);
    expect(composant['erreurLangues']()).toContain('deux fois');
  });
});
