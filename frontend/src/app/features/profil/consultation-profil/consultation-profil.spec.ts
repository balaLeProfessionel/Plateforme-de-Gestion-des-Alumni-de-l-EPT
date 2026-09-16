import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { ProfilPublic } from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { ConsultationProfil } from './consultation-profil';

describe('ConsultationProfil', () => {
  let fixture: ComponentFixture<ConsultationProfil>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let service: {
    obtenirProfilPublic: ReturnType<typeof vi.fn>;
    obtenirProfil: ReturnType<typeof vi.fn>;
    listerExperiences: ReturnType<typeof vi.fn>;
    listerFormations: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({ id: 'membre-1' }));
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
        { provide: ActivatedRoute, useValue: { paramMap: parametres } },
        { provide: ProfilService, useValue: service }
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
  });

  it('affiche les coordonnées privées et les états vides sur son propre profil', async () => {
    parametres.next(convertToParamMap({}));
    creerComposant();
    await fixture.whenStable();

    const contenu = fixture.nativeElement.textContent;
    expect(service.obtenirProfil).toHaveBeenCalled();
    expect(contenu).toContain('Informations privées');
    expect(contenu).toContain('awa@example.com');
    expect(contenu).toContain('Aucune expérience renseignée.');
    expect(contenu).toContain('Aucune formation renseignée.');
    expect(fixture.nativeElement.querySelector('.modifier')).not.toBeNull();
  });

  it('met les expériences et formations de l EPT dans une section dédiée', async () => {
    service.obtenirProfilPublic.mockReturnValue(of({
      ...profilPublic(),
      experiences: [{
        id: 'exp-1', poste: 'Assistant de recherche', typeContrat: 'CDD',
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

    const section = fixture.nativeElement.querySelector('.parcours-ept');
    expect(section?.textContent).toContain('Parcours à l’EPT');
    expect(section?.textContent).toContain('Assistant de recherche');
    expect(section?.textContent).toContain('Diplôme d ingénieur');
    expect(section?.querySelector('h4')?.getAttribute('title')).toBe('Assistant de recherche');
    const logo = section?.querySelector('.logo-ept') as HTMLImageElement | undefined;
    expect(logo?.getAttribute('src')).toBe('/images/logo-ept.png');
    expect(logo?.getAttribute('alt')).toBe('Logo de l’École Polytechnique de Thiès');
  });

  function creerComposant(): void {
    fixture = TestBed.createComponent(ConsultationProfil);
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
