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

  it('ne montre le bouton qu’après une modification, avec « Annuler »', () => {
    fixture.componentRef.setInput('boutonSiModifie', true);
    fixture.detectChanges();
    const texte = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte()).not.toContain('Enregistrer mes informations');

    composant['modele'].update((valeurs) => ({ ...valeurs, villeResidence: 'Dakar' }));
    fixture.detectChanges();
    expect(texte()).toContain('Enregistrer mes informations');

    (fixture.nativeElement.querySelector('.btn-annuler') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(texte()).not.toContain('Enregistrer mes informations');
    expect(composant['modele']().villeResidence).toBe(profil().villeResidence ?? '');
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
      lienLinkedin: '', lienPortfolio: '', telephone: '', dateNaissance: '',
      paysResidence: '', situationActuelle: ''
    });

    composant['valider']();

    expect(sauvegarde).toHaveBeenCalledWith({
      nom: 'Diop', prenom: 'Awa', bio: '', villeResidence: '', posteActuel: '',
      lienLinkedin: '', lienPortfolio: '', telephone: '', dateNaissance: undefined,
      paysResidence: '', situationActuelle: '',
      effacerDateNaissance: true
    });
  });

  it('ne complète depuis le CV que les champs vides, une fois le profil reçu', () => {
    const cv = {
      prenom: 'Autre', nom: 'Personne', telephone: null, villeResidence: 'Dakar', paysResidence: 'SN',
      posteActuel: null, bio: null, lienLinkedin: null, lienPortfolio: null
    };
    fixture.componentRef.setInput('profil', null);
    fixture.componentRef.setInput('prerempli', cv);
    fixture.detectChanges();
    expect(composant['modele']().prenom).toBe('');

    fixture.componentRef.setInput('profil', { ...profil(), villeResidence: null });
    fixture.detectChanges();
    expect(composant['modele']()).toEqual(expect.objectContaining({
      prenom: 'Awa', nom: 'Diop', villeResidence: 'Dakar', paysResidence: 'SN', bio: 'Bio'
    }));
    expect(composant['completeParCv']()).toBe(true);
  });

  function profil(): Profil {
    return {
      id: 'membre-1', nom: 'Diop', prenom: 'Awa', email: 'awa@example.com',
      role: 'ALUMNI', statutCompte: 'ACTIF', bio: 'Bio', villeResidence: 'Thiès',
      posteActuel: 'Ingénieure', lienLinkedin: 'https://linkedin.com/in/awa',
      lienPortfolio: 'https://awa.example.com', urlPhoto: null, telephone: '770000000',
      dateNaissance: '2000-01-01', filiere: 'GIT', classe: null, anneeSortie: 2024, recherchePublique: true,
      situationActuelle: null, paysResidence: null
    };
  }
});
