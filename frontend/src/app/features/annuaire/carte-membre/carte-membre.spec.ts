import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AnnuaireMembre } from '../../../core/services/models/annuaire.model';
import { CarteMembre } from './carte-membre';

describe('CarteMembre', () => {
  let fixture: ComponentFixture<CarteMembre>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarteMembre],
      providers: [provideRouter([])]
    }).compileComponents();
    fixture = TestBed.createComponent(CarteMembre);
  });

  it.each([
    ['ETUDIANT', 'ACTIF', 'Étudiant'],
    ['ALUMNI', 'ACTIF', 'Alumni'],
    ['PERSONNEL', 'ACTIF', 'Personnel'],
    ['PERSONNEL', 'EN_ATTENTE', 'En attente']
  ] as const)('affiche le badge attendu pour %s %s', async (role, statutCompte, badge) => {
    fixture.componentRef.setInput('membre', membre({ role, statutCompte }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.badge')?.textContent.trim()).toBe(badge);
  });

  it('ne montre aucun badge pour un visiteur actif', async () => {
    fixture.componentRef.setInput('membre', membre({ role: 'VISITEUR' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.badge')).toBeNull();
  });

  it('ne rend jamais les coordonnées privées reçues par erreur', async () => {
    fixture.componentRef.setInput('membre', {
      ...membre({}),
      email: 'awa.diop@example.com',
      telephone: '770000000',
      dateNaissance: '2000-01-01'
    });
    await fixture.whenStable();

    const contenu = fixture.nativeElement.textContent;
    expect(contenu).not.toContain('awa.diop@example.com');
    expect(contenu).not.toContain('770000000');
    expect(contenu).not.toContain('2000-01-01');
  });

  it('ouvre la page publique du membre', async () => {
    fixture.componentRef.setInput('membre', membre({ id: 'membre-42' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.carte-lien')?.getAttribute('href'))
      .toBe('/profil/membre-42');
  });

  it('affiche un organisme sans créer de lien vers un profil personnel', async () => {
    fixture.componentRef.setInput('membre', membre({
      nom: 'SunuTech', prenom: null, role: 'ORGANISME', posteActuel: 'Numérique'
    }));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('SunuTech');
    expect(fixture.nativeElement.textContent).toContain('Secteur');
    expect(fixture.nativeElement.querySelector('.carte-lien')).toBeNull();
  });

  function membre(modifications: Partial<AnnuaireMembre>): AnnuaireMembre {
    return {
      id: 'membre-1',
      nom: 'Diop',
      prenom: 'Awa',
      role: 'ETUDIANT',
      statutCompte: 'ACTIF',
      urlPhoto: null,
      posteActuel: 'Élève ingénieure',
      villeResidence: 'Thiès',
      filiere: 'Génie Informatique et Télécommunications',
      anneeSortie: 2025,
      ...modifications
    };
  }
});
