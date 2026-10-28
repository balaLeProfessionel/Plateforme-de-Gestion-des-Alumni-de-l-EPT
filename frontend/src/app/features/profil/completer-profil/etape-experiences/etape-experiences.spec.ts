import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Experience, ExperienceRequest } from '../../../../core/services/models/profil.model';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { EtapeExperiences } from './etape-experiences';

describe('EtapeExperiences', () => {
  let fixture: ComponentFixture<EtapeExperiences>;
  let composant: EtapeExperiences;
  let profilService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true, value: vi.fn()
    });
    profilService = {
      listerExperiences: vi.fn().mockReturnValue(of([experience('exp-1', 'Poste initial')])),
      creerExperience: vi.fn().mockReturnValue(of(experience('exp-2', 'Nouveau poste'))),
      modifierExperience: vi.fn().mockReturnValue(of(experience('exp-1', 'Poste modifié'))),
      supprimerExperience: vi.fn().mockReturnValue(of(void 0))
    };

    await TestBed.configureTestingModule({
      imports: [EtapeExperiences],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: profilService },
        { provide: OrganismeService, useValue: { rechercherOrganismes: vi.fn().mockReturnValue(of([])) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ modifier: 'exp-1' }) } }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(EtapeExperiences);
    composant = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ouvre et place le focus sur l expérience demandée', () => {
    const cible = { scrollIntoView: vi.fn(), focus: vi.fn() } as unknown as HTMLElement;
    const recherche = vi.spyOn(document, 'getElementById').mockReturnValue(cible);
    const animation = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((rappel) => {
      rappel(0);
      return 1;
    });

    composant['mettreEnAvant']([experience('exp-1', 'Poste initial')]);

    expect(recherche).toHaveBeenCalledWith('experience-exp-1');
    expect(cible.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(cible.focus).toHaveBeenCalledWith({ preventScroll: true });
    recherche.mockRestore();
    animation.mockRestore();
  });

  it('crée et modifie les expériences puis termine le parcours', () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate');
    const donnees = requete();

    composant['enregistrerTout']([
      { cle: 'nouvelle-experience-1', id: null, donnees },
      { cle: 'exp-1', id: 'exp-1', donnees: { ...donnees, poste: 'Poste modifié' } }
    ]);

    expect(profilService['creerExperience']).toHaveBeenCalledWith(donnees);
    expect(profilService['modifierExperience']).toHaveBeenCalledWith(
      'exp-1', expect.objectContaining({ poste: 'Poste modifié' })
    );
    expect(composant['experiences']().map((item) => item.poste)).toEqual([
      'Poste modifié', 'Nouveau poste'
    ]);
    expect(navigation).toHaveBeenCalledWith(['/accueil']);
  });

  function requete(): ExperienceRequest {
    return {
      poste: 'Nouveau poste', description: 'Mission', typeContrat: 'CDD',
      dateDebut: '2025-01-01', dateFin: '2025-06-30', estStage: false,
      organismeId: 'organisme-1'
    };
  }

  function experience(id: string, poste: string): Experience {
    return {
      id, poste, description: 'Mission', typeContrat: 'CDD', dateDebut: '2025-01-01',
      dateFin: '2025-06-30', estStage: false, enCours: false,
      organismeId: 'organisme-1', nomOrganisme: 'EPT', etablissementEpt: true
    };
  }
});
