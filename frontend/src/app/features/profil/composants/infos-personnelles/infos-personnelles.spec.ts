import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { Profil } from '../../../../core/services/models/profil.model';
import { InfosPersonnelles } from './infos-personnelles';

describe('InfosPersonnelles', () => {
  let fixture: ComponentFixture<InfosPersonnelles>;
  let composant: InfosPersonnelles;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InfosPersonnelles] }).compileComponents();
    fixture = TestBed.createComponent(InfosPersonnelles);
    composant = fixture.componentInstance;
    fixture.componentRef.setInput('profil', profil());
    fixture.detectChanges();
  });

  it('refuse une identité vide ou trop longue', () => {
    const sauvegarde = vi.spyOn(composant.sauvegarder, 'emit');
    composant['modele'].update((valeurs) => ({ ...valeurs, nom: '', prenom: 'P'.repeat(101) }));

    composant['valider']();

    expect(composant['formulaire']().invalid()).toBe(true);
    expect(sauvegarde).not.toHaveBeenCalled();
  });

  it('refuse les liens sans protocole HTTP ou HTTPS', () => {
    const sauvegarde = vi.spyOn(composant.sauvegarder, 'emit');
    composant['modele'].update((valeurs) => ({ ...valeurs, lienLinkedin: 'linkedin.com/awa' }));

    composant['valider']();

    expect(composant['formulaire'].lienLinkedin().invalid()).toBe(true);
    expect(sauvegarde).not.toHaveBeenCalled();
  });

  it('émet explicitement l effacement des champs facultatifs et de la date', () => {
    const sauvegarde = vi.spyOn(composant.sauvegarder, 'emit');
    composant['modele'].set({
      nom: ' Diop ', prenom: ' Awa ', bio: '', villeResidence: '', posteActuel: '',
      lienLinkedin: '', lienPortfolio: '', telephone: '', dateNaissance: ''
    });

    composant['valider']();

    expect(sauvegarde).toHaveBeenCalledWith({
      nom: 'Diop', prenom: 'Awa', bio: '', villeResidence: '', posteActuel: '',
      lienLinkedin: '', lienPortfolio: '', telephone: '', dateNaissance: undefined,
      effacerDateNaissance: true
    });
  });

  function profil(): Profil {
    return {
      id: 'membre-1', nom: 'Diop', prenom: 'Awa', email: 'awa@example.com',
      role: 'ALUMNI', statutCompte: 'ACTIF', bio: 'Bio', villeResidence: 'Thiès',
      posteActuel: 'Ingénieure', lienLinkedin: 'https://linkedin.com/in/awa',
      lienPortfolio: 'https://awa.example.com', urlPhoto: null, telephone: '770000000',
      dateNaissance: '2000-01-01', filiere: 'GIT', anneeSortie: 2024
    };
  }
});
