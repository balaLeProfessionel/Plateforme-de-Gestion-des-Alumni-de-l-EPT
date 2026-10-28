import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Formation, FormationRequest } from '../../../../core/services/models/profil.model';
import { OrganismeService } from '../../../../core/services/organisme/organisme-service';
import { ProfilService } from '../../../../core/services/profil/profil-service';
import { EtapeFormations } from './etape-formations';

describe('EtapeFormations', () => {
  let fixture: ComponentFixture<EtapeFormations>;
  let composant: EtapeFormations;
  let profilService: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true, value: vi.fn()
    });
    profilService = {
      listerFormations: vi.fn().mockReturnValue(of([formation('formation-1', 'Formation initiale')])),
      creerFormation: vi.fn().mockReturnValue(of(formation('formation-2', 'Nouvelle formation'))),
      modifierFormation: vi.fn().mockReturnValue(of(formation('formation-1', 'Formation modifiée'))),
      supprimerFormation: vi.fn().mockReturnValue(of(void 0))
    };

    await TestBed.configureTestingModule({
      imports: [EtapeFormations],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: profilService },
        { provide: OrganismeService, useValue: { rechercherOrganismes: vi.fn().mockReturnValue(of([])) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ modifier: 'formation-1' }) } }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(EtapeFormations);
    composant = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ouvre et place le focus sur la formation demandée', () => {
    const cible = { scrollIntoView: vi.fn(), focus: vi.fn() } as unknown as HTMLElement;
    const recherche = vi.spyOn(document, 'getElementById').mockReturnValue(cible);
    const animation = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((rappel) => {
      rappel(0);
      return 1;
    });

    composant['mettreEnAvant']([formation('formation-1', 'Formation initiale')]);

    expect(recherche).toHaveBeenCalledWith('formation-formation-1');
    expect(cible.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(cible.focus).toHaveBeenCalledWith({ preventScroll: true });
    recherche.mockRestore();
    animation.mockRestore();
  });

  it('crée et modifie les formations puis ouvre les expériences', () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate');
    const donnees = requete();

    composant['enregistrerTout']([
      { cle: 'nouvelle-formation-1', id: null, donnees },
      { cle: 'formation-1', id: 'formation-1', donnees: { ...donnees, libelle: 'Formation modifiée' } }
    ]);

    expect(profilService['creerFormation']).toHaveBeenCalledWith(donnees);
    expect(profilService['modifierFormation']).toHaveBeenCalledWith(
      'formation-1', expect.objectContaining({ libelle: 'Formation modifiée' })
    );
    expect(composant['formations']().map((item) => item.libelle)).toEqual([
      'Formation modifiée', 'Nouvelle formation'
    ]);
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/experiences']);
  });

  function requete(): FormationRequest {
    return {
      libelle: 'Nouvelle formation', description: 'Programme', typeFormation: 'CERTIFICATION',
      dateDebut: '2025-01-01', dateFin: '2025-06-30', estStage: false,
      organismeId: 'organisme-1'
    };
  }

  function formation(id: string, libelle: string): Formation {
    return {
      id, libelle, description: 'Programme', typeFormation: 'CERTIFICATION',
      dateDebut: '2025-01-01', dateFin: '2025-06-30', estStage: false, enCours: false,
      organismeId: 'organisme-1', nomOrganisme: 'EPT', etablissementEpt: true
    };
  }
});
