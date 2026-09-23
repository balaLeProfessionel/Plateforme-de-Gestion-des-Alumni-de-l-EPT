import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { ProfilPublic } from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { DetailParcours } from './detail-parcours';

describe('DetailParcours', () => {
  let fixture: ComponentFixture<DetailParcours>;
  let service: {
    obtenirProfilPublic: ReturnType<typeof vi.fn>;
    supprimerExperience: ReturnType<typeof vi.fn>;
    supprimerFormation: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    service = {
      obtenirProfilPublic: vi.fn().mockReturnValue(of(profil())),
      supprimerExperience: vi.fn().mockReturnValue(of(void 0)),
      supprimerFormation: vi.fn().mockReturnValue(of(void 0))
    };

    await TestBed.configureTestingModule({
      imports: [DetailParcours],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { typeParcours: 'experience' } },
            paramMap: new BehaviorSubject(convertToParamMap({ id: 'membre-1', parcoursId: 'exp-1' }))
          }
        },
        { provide: ProfilService, useValue: service },
        { provide: AuthService, useValue: { utilisateur: () => ({ id: 'membre-1' }) } }
      ]
    }).compileComponents();
  });

  it('affiche toutes les informations de l expérience et les actions du propriétaire', async () => {
    fixture = TestBed.createComponent(DetailParcours);
    await fixture.whenStable();

    const contenu = fixture.nativeElement.textContent;
    expect(contenu).toContain('Ingénieure logiciel');
    expect(contenu).toContain('Conception de services accessibles');
    expect(contenu).toContain('Fonction publique');
    expect(contenu).toContain('Parcours à l’EPT');
    const lien = fixture.nativeElement.querySelector('.modifier') as HTMLAnchorElement;
    expect(lien).not.toBeNull();
    expect(lien.getAttribute('href')).toBe('/completer-profil/experiences?modifier=exp-1');
  });

  it('demande confirmation puis supprime l expérience et retourne au profil', async () => {
    fixture = TestBed.createComponent(DetailParcours);
    await fixture.whenStable();
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigate');

    const boutons = () => Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    );
    boutons().find((bouton) => bouton.textContent?.trim() === 'Supprimer')?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Supprimer définitivement cet élément du parcours ?');
    boutons().find((bouton) => bouton.textContent?.trim() === 'Confirmer la suppression')?.click();
    await fixture.whenStable();

    expect(service.supprimerExperience).toHaveBeenCalledWith('exp-1');
    expect(navigation).toHaveBeenCalledWith(['/profil']);
  });

  function profil(): ProfilPublic {
    return {
      id: 'membre-1', nom: 'Diop', prenom: 'Awa', role: 'ALUMNI', statutCompte: 'ACTIF',
      bio: null, villeResidence: 'Thiès', posteActuel: 'Ingénieure logiciel',
      lienLinkedin: null, lienPortfolio: null, urlPhoto: null, filiere: null, anneeSortie: 2024,
      experiences: [{
        id: 'exp-1', poste: 'Ingénieure logiciel', description: 'Conception de services accessibles',
        typeContrat: 'FONCTION_PUBLIQUE', dateDebut: '2024-01-01', dateFin: null,
        estStage: false, enCours: true, organismeId: 'ept',
        nomOrganisme: 'École Polytechnique de Thiès (EPT)', etablissementEpt: true
      }],
      formations: []
    };
  }
});
