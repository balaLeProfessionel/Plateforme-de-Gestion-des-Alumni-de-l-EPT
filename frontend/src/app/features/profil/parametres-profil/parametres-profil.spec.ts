import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { Profil } from '../../../core/services/models/profil.model';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { ParametresProfil } from './parametres-profil';

describe('ParametresProfil', () => {
  let fixture: ComponentFixture<ParametresProfil>;
  let composant: ParametresProfil;
  let profilService: {
    obtenirProfil: ReturnType<typeof vi.fn>;
    majProfil: ReturnType<typeof vi.fn>;
    modifierPhoto: ReturnType<typeof vi.fn>;
    supprimerPhoto: ReturnType<typeof vi.fn>;
  };
  let authService: {
    synchroniserProfil: ReturnType<typeof vi.fn>;
    changerMotDePasse: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    profilService = {
      obtenirProfil: vi.fn().mockReturnValue(of(profil())),
      majProfil: vi.fn().mockReturnValue(of({ ...profil(), prenom: 'Aminata' })),
      modifierPhoto: vi.fn().mockReturnValue(of({ ...profil(), urlPhoto: '/api/photos/photo.png' })),
      supprimerPhoto: vi.fn().mockReturnValue(of({ ...profil(), urlPhoto: null }))
    };
    authService = {
      synchroniserProfil: vi.fn(),
      changerMotDePasse: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ParametresProfil],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: profilService },
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ParametresProfil);
    composant = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('affiche les sections et les informations non modifiables', () => {
    const contenu = fixture.nativeElement.textContent;
    expect(contenu).toContain('Photo de profil');
    expect(contenu).toContain('Identité et informations');
    expect(contenu).toContain('Sécurité');
    expect(contenu).toContain('awa.diop@example.com');
    expect(contenu).toContain('Alumni');
  });

  it('synchronise la session après la modification des informations', () => {
    composant['enregistrerInformations']({ nom: 'Diop', prenom: 'Aminata' });

    expect(profilService.majProfil).toHaveBeenCalled();
    expect(authService.synchroniserProfil).toHaveBeenCalledWith(
      expect.objectContaining({ prenom: 'Aminata' })
    );
  });

  it('refuse une photo non prise en charge avant l appel réseau', () => {
    const fichier = new File(['texte'], 'profil.txt', { type: 'text/plain' });
    composant['choisirPhoto']({ target: { files: [fichier], value: 'profil.txt' } } as unknown as Event);

    expect(composant['erreurPhoto']()).toContain('JPEG ou PNG');
    expect(profilService.modifierPhoto).not.toHaveBeenCalled();
  });

  it('change le mot de passe et conserve les nouveaux jetons gérés par AuthService', () => {
    composant['modeleMotDePasse'].set({
      actuel: 'AncienPass2026!', nouveau: 'NouveauPass2026!', confirmation: 'NouveauPass2026!'
    });
    composant['changerMotDePasse']();

    expect(authService.changerMotDePasse).toHaveBeenCalledWith('AncienPass2026!', 'NouveauPass2026!');
    expect(composant['messageMotDePasse']()?.type).toBe('succes');
  });

  it('affiche une erreur générique quand le mot de passe actuel est incorrect', () => {
    authService.changerMotDePasse.mockReturnValue(throwError(() => ({ status: 401 })));
    composant['modeleMotDePasse'].set({
      actuel: 'Incorrect2026!', nouveau: 'NouveauPass2026!', confirmation: 'NouveauPass2026!'
    });
    composant['changerMotDePasse']();

    expect(composant['messageMotDePasse']()?.texte).toBe('Le mot de passe actuel est incorrect.');
  });

  function profil(): Profil {
    return {
      id: 'membre-1', nom: 'Diop', prenom: 'Awa', email: 'awa.diop@example.com',
      role: 'ALUMNI', statutCompte: 'ACTIF', bio: null, villeResidence: 'Thiès',
      posteActuel: null, lienLinkedin: null, lienPortfolio: null, urlPhoto: null,
      telephone: null, dateNaissance: null, filiere: 'GIT', anneeSortie: 2024
    };
  }
});
