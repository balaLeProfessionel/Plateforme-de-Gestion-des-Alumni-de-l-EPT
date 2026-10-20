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

  function racine(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it.each([
    ['ETUDIANT', 'Étudiant'],
    ['ALUMNI', 'Alumni'],
    ['PERSONNEL', 'Personnel EPT'],
    ['VISITEUR', 'Visiteur']
  ] as const)('met en avant le rôle %s dans le bandeau', async (role, libelle) => {
    fixture.componentRef.setInput('membre', membre({ role }));
    await fixture.whenStable();

    expect(racine().querySelector('.carte')?.getAttribute('data-role')).toBe(role);
    expect(racine().querySelector('.bandeau .role')?.textContent?.trim()).toBe(libelle);
  });

  it('garde le rôle visible et ajoute la vérification en attente', async () => {
    fixture.componentRef.setInput('membre', membre({ role: 'ALUMNI', statutCompte: 'EN_ATTENTE' }));
    await fixture.whenStable();

    expect(racine().querySelector('.bandeau .role')?.textContent?.trim()).toBe('Alumni');
    expect(racine().querySelector('.attente')?.textContent?.trim()).toBe('En attente de vérification');
  });

  it('présente la promotion d’un alumni et la sortie prévue d’un étudiant', async () => {
    fixture.componentRef.setInput('membre', membre({ role: 'ALUMNI', anneeSortie: 2018, filiere: 'Génie Civil' }));
    await fixture.whenStable();
    expect(racine().querySelector('.parcours')?.textContent?.trim()).toBe('Promo 2018 · Génie Civil');

    fixture.componentRef.setInput('membre', membre({ role: 'ETUDIANT', anneeSortie: 2027, filiere: 'Génie Informatique' }));
    await fixture.whenStable();
    expect(racine().querySelector('.parcours')?.textContent?.trim()).toBe('Génie Informatique · Sortie prévue 2027');
    expect(racine().querySelector('.activite')?.textContent?.trim()).toBe('Élève ingénieure · Thiès');
  });

  it('omet les informations absentes au lieu d’afficher « Non renseigné »', async () => {
    fixture.componentRef.setInput('membre', membre({
      role: 'VISITEUR', posteActuel: null, villeResidence: null, filiere: null, anneeSortie: null
    }));
    await fixture.whenStable();

    expect(racine().textContent).not.toContain('Non renseigné');
    expect(racine().querySelector('.parcours')).toBeNull();
    expect(racine().querySelector('.a-completer')?.textContent?.trim()).toBe('Profil à compléter');
  });

  it('ne rend jamais les coordonnées privées reçues par erreur', async () => {
    fixture.componentRef.setInput('membre', {
      ...membre({}),
      email: 'awa.diop@example.com',
      telephone: '770000000',
      dateNaissance: '2000-01-01'
    });
    await fixture.whenStable();

    const contenu = racine().textContent;
    expect(contenu).not.toContain('awa.diop@example.com');
    expect(contenu).not.toContain('770000000');
    expect(contenu).not.toContain('2000-01-01');
  });

  it('ouvre la page publique du membre', async () => {
    fixture.componentRef.setInput('membre', membre({ id: 'membre-42' }));
    await fixture.whenStable();

    expect(racine().querySelector('.carte-lien')?.getAttribute('href')).toBe('/profil/membre-42');
    expect(racine().querySelector('.action')?.textContent?.trim()).toBe('Voir le profil');
  });

  it('conserve le texte complet des lignes tronquées dans leur infobulle', async () => {
    const poste = 'Responsable de la transformation numérique et des plateformes distribuées';
    fixture.componentRef.setInput('membre', membre({ posteActuel: poste, villeResidence: null }));
    await fixture.whenStable();

    expect(racine().querySelector('.activite')?.getAttribute('title')).toBe(poste);
  });

  it('affiche le type d’organisme, son secteur et ouvre sa fiche', async () => {
    fixture.componentRef.setInput('membre', membre({
      id: 'compte-sunu', organismeId: 'sunu-42', nom: 'SunuTech', prenom: null, role: 'ORGANISME',
      typeOrganisme: 'ENTREPRISE', posteActuel: 'Numérique', villeResidence: 'Dakar',
      filiere: null, anneeSortie: null
    }));
    await fixture.whenStable();

    expect(racine().querySelector('.bandeau .role')?.textContent?.trim()).toBe('Entreprise');
    expect(racine().querySelector('.avatar')?.classList).toContain('logo');
    expect(racine().querySelector('.avatar')?.textContent?.trim()).toBe('S');
    expect(racine().querySelector('.parcours')?.textContent?.trim()).toBe('Numérique');
    expect(racine().querySelector('.activite')?.textContent?.trim()).toBe('Dakar');
    expect(racine().querySelector('.carte-lien')?.getAttribute('href')).toBe('/organismes/sunu-42');
    expect(racine().querySelector('.action')?.textContent?.trim()).toBe('Voir l’organisme');
  });

  it('nomme « Organisme » un type inconnu et ne propose pas de lien sans fiche', async () => {
    fixture.componentRef.setInput('membre', membre({
      nom: 'Collectif Thiès', prenom: null, role: 'ORGANISME', typeOrganisme: null, organismeId: null
    }));
    await fixture.whenStable();

    expect(racine().querySelector('.bandeau .role')?.textContent?.trim()).toBe('Organisme');
    expect(racine().querySelector('.carte-lien')).toBeNull();
    expect(racine().querySelector('.action')).toBeNull();
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
      organismeId: null,
      typeOrganisme: null,
      ...modifications
    };
  }
});
