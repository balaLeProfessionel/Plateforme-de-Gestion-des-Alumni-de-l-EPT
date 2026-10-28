import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { Profil } from '../../../core/services/models/profil.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
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
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true, value: vi.fn().mockReturnValue('blob:apercu-photo')
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true, value: vi.fn()
    });
    profilService = {
      obtenirProfil: vi.fn().mockReturnValue(of(profil())),
      majProfil: vi.fn().mockReturnValue(of({ ...profil(), prenom: 'Aminata' })),
      modifierPhoto: vi.fn().mockReturnValue(of({ ...profil(), urlPhoto: '/api/photos/photo.png' })),
      supprimerPhoto: vi.fn().mockReturnValue(of({ ...profil(), urlPhoto: null })),
      listerExperiences: vi.fn().mockReturnValue(of([])),
      listerFormations: vi.fn().mockReturnValue(of([]))
    } as typeof profilService;
    authService = {
      synchroniserProfil: vi.fn(),
      changerMotDePasse: vi.fn().mockReturnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [ParametresProfil],
      providers: [
        provideRouter([]),
        { provide: ProfilService, useValue: profilService },
        { provide: AuthService, useValue: authService },
        { provide: OrganismeService, useValue: { rechercherOrganismes: vi.fn().mockReturnValue(of([])) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ParametresProfil);
    composant = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('affiche les sections et les informations non modifiables', () => {
    const contenu = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Modifier mon profil');
    expect([...fixture.nativeElement.querySelectorAll('.navigation-sections a')].map((a: Element) => a.textContent?.trim()))
      .toEqual(['Photo', 'Informations', 'Parcours', 'Sécurité']);
    expect(fixture.nativeElement.querySelector('.voir-profil')?.getAttribute('href')).toBe('/profil');
    expect(contenu).toContain('Expériences professionnelles');
    expect(contenu).toContain('Formations');
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

  it('refuse une photo non prise en charge avant l appel réseau', async () => {
    const fichier = new File(['texte'], 'profil.txt', { type: 'text/plain' });
    await composant['choisirPhoto']({ target: { files: [fichier], value: 'profil.txt' } } as unknown as Event);

    expect(composant['erreurPhoto']()).toContain('JPEG ou PNG');
    expect(profilService.modifierPhoto).not.toHaveBeenCalled();
  });

  it('affiche puis libère l aperçu local de la photo recadrée', () => {
    const fichier = new File(['image'], 'profil.jpg', { type: 'image/jpeg' });

    composant['appliquerRecadrage'](fichier);

    expect(composant['sourcePhoto']()).toBe('blob:apercu-photo');
    expect(composant['fichierPhoto']()).toBe(fichier);
    composant['annulerPhoto']();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:apercu-photo');
    expect(composant['sourcePhoto']()).toBeNull();
  });

  it('refuse une photo dépassant cinq mégaoctets avant l appel réseau', async () => {
    const fichier = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)], 'profil.jpg', { type: 'image/jpeg' }
    );

    await composant['choisirPhoto']({ target: { files: [fichier], value: 'profil.jpg' } } as unknown as Event);

    expect(composant['erreurPhoto']()).toContain('5 Mo');
    expect(profilService.modifierPhoto).not.toHaveBeenCalled();
  });

  it('enregistre puis supprime la photo et synchronise la session', () => {
    const fichier = new File(['image'], 'profil.jpg', { type: 'image/jpeg' });
    composant['appliquerRecadrage'](fichier);

    composant['enregistrerPhoto']();

    expect(profilService.modifierPhoto).toHaveBeenCalledWith(fichier);
    expect(authService.synchroniserProfil).toHaveBeenCalledWith(
      expect.objectContaining({ urlPhoto: '/api/photos/photo.png' })
    );
    composant['supprimerPhoto']();
    expect(profilService.supprimerPhoto).toHaveBeenCalled();
    expect(composant['profil']()?.urlPhoto).toBeNull();
    expect(composant['succesPhoto']()).toBe('Photo de profil supprimée.');
  });

  it('revient aux initiales quand l image du profil ne charge pas', () => {
    composant['profil'].set({ ...profil(), urlPhoto: '/api/photos/introuvable.png' });
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('app-avatar-membre img') as HTMLImageElement;

    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-avatar-membre img')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-avatar-membre').textContent).toContain('AD');
  });

  it('affiche une erreur de chargement puis permet de réessayer', () => {
    profilService.obtenirProfil.mockReturnValueOnce(throwError(() => new Error('indisponible')));

    composant['charger']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger les paramètres du profil.');
    expect(fixture.nativeElement.textContent).toContain('Réessayer');
    profilService.obtenirProfil.mockReturnValueOnce(of(profil()));
    composant['charger']();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Identité et informations');
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

  it('signale les champs obligatoires après une tentative vide de changement du mot de passe', () => {
    composant['changerMotDePasse']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Le mot de passe actuel est obligatoire');
    expect(fixture.nativeElement.textContent).toContain('Le nouveau mot de passe est obligatoire');
    expect(fixture.nativeElement.textContent).toContain('Confirmez le nouveau mot de passe');
    expect(authService.changerMotDePasse).not.toHaveBeenCalled();
  });

  it('garde les champs de mot de passe neutres avant interaction', () => {
    fixture.detectChanges();
    const champs = fixture.nativeElement.querySelectorAll('.formulaire-securite input');

    expect(champs).toHaveLength(3);
    for (const champ of champs) {
      expect(champ.classList.contains('p-invalid')).toBe(false);
      expect(champ.getAttribute('aria-invalid')).toBeNull();
      expect(champ.getAttribute('aria-describedby')).toBeNull();
    }
  });

  it('marque en erreur et relie les messages après une soumission invalide', () => {
    composant['changerMotDePasse']();
    fixture.detectChanges();
    const champs = [...fixture.nativeElement.querySelectorAll('.formulaire-securite input')];

    expect(champs).toHaveLength(3);
    expect(champs.every((champ) => champ.classList.contains('p-invalid'))).toBe(true);
    expect(champs.map((champ) => champ.getAttribute('aria-invalid'))).toEqual(['true', 'true', 'true']);
    expect(champs.map((champ) => champ.getAttribute('aria-describedby'))).toEqual([
      'erreur-mot-de-passe-actuel', 'erreur-nouveau-mot-de-passe', 'erreur-confirmation-mot-de-passe'
    ]);
  });

  it('garde les liens de section sur la route des paramètres', () => {
    fixture.detectChanges();
    const liens = [...fixture.nativeElement.querySelectorAll('.navigation-sections a')]
      .map((lien: HTMLAnchorElement) => lien.getAttribute('href'));

    expect(liens).toEqual([
      '/profil/parametres#photo', '/profil/parametres#informations', '/profil/parametres#parcours', '/profil/parametres#securite'
    ]);
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
