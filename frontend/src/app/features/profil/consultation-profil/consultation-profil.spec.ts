import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { ProfilPublic } from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { simulerDialogue } from '../../../testing/dialogue';
import { ConsultationProfil } from './consultation-profil';

describe('ConsultationProfil', () => {
  let fixture: ComponentFixture<ConsultationProfil>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let requete: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let service: {
    obtenirProfilPublic: ReturnType<typeof vi.fn>;
    obtenirProfil: ReturnType<typeof vi.fn>;
    listerExperiences: ReturnType<typeof vi.fn>;
    listerFormations: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({ id: 'membre-1' }));
    requete = new BehaviorSubject(convertToParamMap({}));
    service = {
      obtenirProfilPublic: vi.fn().mockReturnValue(of(profilPublic())),
      obtenirProfil: vi.fn().mockReturnValue(of({
        ...profilPublic(), email: 'awa@example.com', telephone: null, dateNaissance: null
      })),
      listerExperiences: vi.fn().mockReturnValue(of([])),
      listerFormations: vi.fn().mockReturnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [ConsultationProfil],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: parametres, queryParamMap: requete } },
        { provide: ProfilService, useValue: service },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi', role: 'ALUMNI' }) } }
      ]
    }).compileComponents();
  });

  it('affiche seulement les champs publics renseignés pour un autre membre', async () => {
    creerComposant();
    await fixture.whenStable();

    const contenu = fixture.nativeElement.textContent;
    expect(service.obtenirProfilPublic).toHaveBeenCalledWith('membre-1');
    expect(contenu).toContain('Awa Diop');
    expect(contenu).toContain('Thiès');
    expect(contenu).toContain('Ce membre n’a pas encore complété son parcours.');
    expect(contenu).not.toContain('Informations privées');
    expect(contenu).not.toContain('awa@example.com');
    expect(fixture.nativeElement.querySelector('.modifier')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-bouton-retour')?.textContent).toContain('Retour');
  });

  it('affiche les coordonnées privées et les états vides sur son propre profil', async () => {
    parametres.next(convertToParamMap({}));
    creerComposant();
    await fixture.whenStable();

    const contenu = fixture.nativeElement.textContent;
    expect(service.obtenirProfil).toHaveBeenCalled();
    expect(contenu).toContain('Informations privées');
    expect(contenu).toContain('awa@example.com');
    expect(contenu).toContain('Votre parcours est vide');
    expect(fixture.nativeElement.querySelector('a[href="/profil/parametres#parcours"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.modifier')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-bouton-retour')?.textContent).toContain('Retour');
  });

  it('reconnaît mon propre profil ouvert par son identifiant', async () => {
    parametres.next(convertToParamMap({ id: 'moi' }));
    creerComposant();
    await fixture.whenStable();

    expect(service.obtenirProfil).toHaveBeenCalled();
    expect(service.obtenirProfilPublic).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Informations privées');
    expect(fixture.nativeElement.querySelector('.modifier')).not.toBeNull();
  });

  it('revient à l’écran précédent en conservant ses filtres', async () => {
    const location = TestBed.inject(Location);
    vi.spyOn(location, 'getState').mockReturnValue({ navigationId: 3 });
    const retourNavigateur = vi.spyOn(location, 'back').mockImplementation(() => undefined);

    creerComposant();
    await fixture.whenStable();
    fixture.nativeElement.querySelector('app-bouton-retour button').click();

    expect(retourNavigateur).toHaveBeenCalledOnce();
  });

  it('propose une destination de secours lorsque le profil est ouvert directement', async () => {
    const router = TestBed.inject(Router);
    const navigationSecours = vi.spyOn(router, 'navigateByUrl');

    creerComposant();
    await fixture.whenStable();
    fixture.nativeElement.querySelector('app-bouton-retour button').click();

    expect(navigationSecours).toHaveBeenCalledWith('/annuaire');
  });

  it('réunit expériences et formations sur une frise où l’EPT ressort', async () => {
    service.obtenirProfilPublic.mockReturnValue(of({
      ...profilPublic(),
      experiences: [{
        id: 'exp-1', poste: 'Assistant de recherche', description: 'Analyse de données', typeContrat: 'CDD',
        dateDebut: '2024-01-01', dateFin: null, estStage: false, enCours: true,
        organismeId: 'ept', nomOrganisme: 'École Polytechnique de Thiès (EPT)',
        etablissementEpt: true
      }],
      formations: [{
        id: 'formation-1', libelle: 'Diplôme d ingénieur', description: null,
        typeFormation: 'DIPLOMANTE', dateDebut: '2019-01-01', dateFin: '2024-01-01',
        estStage: false, enCours: false, organismeId: 'ept',
        nomOrganisme: 'École Polytechnique de Thiès (EPT)', etablissementEpt: true
      }]
    }));
    creerComposant();
    await fixture.whenStable();

    // Une seule frise, de la plus récente à la plus ancienne ; l’EPT est marquée.
    const elements = [...fixture.nativeElement.querySelectorAll('.frise li')] as HTMLElement[];
    expect(elements.map((li) => li.querySelector('strong')?.textContent)).toEqual(['Assistant de recherche', 'Diplôme d ingénieur']);
    expect(elements.every((li) => li.classList.contains('ept'))).toBe(true);
    expect(elements[0].querySelector('strong')?.getAttribute('title')).toBe('Assistant de recherche');
    expect(elements[0].querySelector('a')?.getAttribute('href')).toContain('experience=exp-1');
    expect(elements[0].querySelector('.periode')?.textContent).toContain('Depuis 2024');
    expect(elements[1].querySelector('a')?.getAttribute('href')).toContain('formation=formation-1');
    expect(elements[0].querySelector('.marque-ept')?.textContent).toContain('EPT');
  });

  it('ouvre la fenêtre de l’étape demandée par l’adresse et passe à la suivante', async () => {
    simulerDialogue();
    service.obtenirProfilPublic.mockReturnValue(of({ ...profilPublic(), experiences: [experience()], formations: [formation()] }));
    requete.next(convertToParamMap({ experience: 'exp-1' }));
    creerComposant();
    await fixture.whenStable();
    fixture.detectChanges();

    const fenetre = fixture.nativeElement.querySelector('app-fenetre-parcours dialog') as HTMLDialogElement;
    expect(fenetre.open).toBe(true);
    expect(fenetre.querySelector('h2')?.textContent).toContain('Assistant de recherche');
    const navigation = TestBed.inject(Router);
    const naviguer = vi.spyOn(navigation, 'navigate').mockResolvedValue(true);
    ([...fenetre.querySelectorAll('button')].find((b) => b.textContent?.includes('Plus ancien')) as HTMLButtonElement).click();
    expect(naviguer).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { formation: 'formation-1' }, replaceUrl: true }));
  });

  function creerComposant(): void {
    fixture = TestBed.createComponent(ConsultationProfil);
  }

  function experience() {
  return {
    id: 'exp-1', poste: 'Assistant de recherche', description: 'Analyse de données', typeContrat: 'CDD' as const,
    dateDebut: '2024-01-01', dateFin: null, estStage: false, enCours: true,
    organismeId: 'ept', nomOrganisme: 'École Polytechnique de Thiès (EPT)', etablissementEpt: true
  };
}

function formation() {
  return {
    id: 'formation-1', libelle: 'Diplôme d ingénieur', description: null, typeFormation: 'DIPLOMANTE' as const,
    dateDebut: '2019-01-01', dateFin: '2024-01-01', estStage: false, enCours: false,
    organismeId: 'ept', nomOrganisme: 'École Polytechnique de Thiès (EPT)', etablissementEpt: true
  };
}

function profilPublic(): ProfilPublic {
    return {
      id: 'membre-1', nom: 'Diop', prenom: 'Awa', role: 'ALUMNI', statutCompte: 'ACTIF',
      bio: null, villeResidence: 'Thiès', posteActuel: null, lienLinkedin: null,
      lienPortfolio: null, urlPhoto: null, filiere: null, anneeSortie: null,
      experiences: [], formations: []
    };
  }
});
