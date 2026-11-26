import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { Profil } from '../../../core/services/models/profil.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { ProfilService } from '../../../core/services/profil/profil-service';
import { ImportCvService } from '../../../core/services/import-cv/import-cv-service';
import { ParametresProfil } from './parametres-profil';

describe('ParametresProfil', () => {
  let fixture: ComponentFixture<ParametresProfil>;
  let composant: ParametresProfil;
  let profilService: {
    obtenirProfil: ReturnType<typeof vi.fn>;
    majProfil: ReturnType<typeof vi.fn>;
    majRecherchePublique: ReturnType<typeof vi.fn>;
    modifierPhoto: ReturnType<typeof vi.fn>;
    supprimerPhoto: ReturnType<typeof vi.fn>;
  };
  let authService: {
    synchroniserProfil: ReturnType<typeof vi.fn>;
    changerMotDePasse: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // writable : sans lui, la propriété devient en lecture seule et casse les tests
    // suivants qui remplacent aussi ces fonctions (ordre d'exécution variable)
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true, writable: true, value: vi.fn().mockReturnValue('blob:apercu-photo')
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true, writable: true, value: vi.fn()
    });
    profilService = {
      obtenirProfil: vi.fn().mockReturnValue(of(profil())),
      majProfil: vi.fn().mockReturnValue(of({ ...profil(), prenom: 'Aminata' })),
      majRecherchePublique: vi.fn().mockReturnValue(of({ ...profil(), recherchePublique: false })),
      modifierPhoto: vi.fn().mockReturnValue(of({ ...profil(), urlPhoto: '/api/photos/photo.png' })),
      supprimerPhoto: vi.fn().mockReturnValue(of({ ...profil(), urlPhoto: null })),
      listerExperiences: vi.fn().mockReturnValue(of([])),
      listerFormations: vi.fn().mockReturnValue(of([])),
      lireCompetencesLangues: vi.fn().mockReturnValue(of({ competences: [], langues: [] })),
      suggererCompetences: vi.fn().mockReturnValue(of([]))
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
        { provide: OrganismeService, useValue: { rechercherOrganismes: vi.fn().mockReturnValue(of([])) } },
        { provide: ImportCvService, useValue: { disponibilite: vi.fn().mockReturnValue(of({ disponible: false })) } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ParametresProfil);
    composant = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('affiche les onglets, le profil par défaut et les informations non modifiables', async () => {
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Modifier mon profil');
    expect([...fixture.nativeElement.querySelectorAll('.onglets a')].map((a: Element) => a.textContent?.trim()))
      .toEqual(['Profil', 'Parcours', 'Compétences', 'Compte']);
    expect(fixture.nativeElement.querySelector('.onglets a[aria-current="page"]')?.textContent?.trim()).toBe('Profil');
    expect(fixture.nativeElement.querySelector('.voir-profil')?.getAttribute('href')).toBe('/profil');
    const contenu = fixture.nativeElement.textContent;
    expect(contenu).toContain('Photo de profil');
    expect(contenu).toContain('Informations personnelles');
    expect(contenu).toContain('awa.diop@example.com');
    expect(contenu).toContain('Alumni');
    expect(contenu).not.toContain('Expériences professionnelles');

    await ouvrirOnglet('parcours');
    expect(fixture.nativeElement.textContent).toContain('Expériences professionnelles');
    expect(fixture.nativeElement.textContent).toContain('Formations');
    expect(fixture.nativeElement.textContent).not.toContain('Photo de profil');
  });

  it('ouvre l onglet d un ancien lien de section', async () => {
    await ouvrirOnglet('securite');
    expect(fixture.nativeElement.querySelector('.onglets a[aria-current="page"]')?.textContent?.trim()).toBe('Compte');
    expect(fixture.nativeElement.textContent).toContain('Sécurité');
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
    expect(fixture.nativeElement.textContent).toContain('Informations personnelles');
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

  it('signale les champs obligatoires après une tentative vide de changement du mot de passe', async () => {
    await ouvrirOnglet('compte');
    composant['changerMotDePasse']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Le mot de passe actuel est obligatoire');
    expect(fixture.nativeElement.textContent).toContain('Le nouveau mot de passe est obligatoire');
    expect(fixture.nativeElement.textContent).toContain('Confirmez le nouveau mot de passe');
    expect(authService.changerMotDePasse).not.toHaveBeenCalled();
  });

  it('garde les champs de mot de passe neutres avant interaction', async () => {
    await ouvrirOnglet('compte');
    const champs = fixture.nativeElement.querySelectorAll('.formulaire-securite input');

    expect(champs).toHaveLength(3);
    for (const champ of champs) {
      expect(champ.classList.contains('p-invalid')).toBe(false);
      expect(champ.getAttribute('aria-invalid')).toBeNull();
      expect(champ.getAttribute('aria-describedby')).toBeNull();
    }
  });

  it('marque en erreur et relie les messages après une soumission invalide', async () => {
    await ouvrirOnglet('compte');
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

  it('enregistre le retrait de la recherche publique', async () => {
    await ouvrirOnglet('compte');
    const caseACocher = fixture.nativeElement.querySelector('#confidentialite input[type="checkbox"]') as HTMLInputElement;
    expect(caseACocher.checked).toBe(true);

    caseACocher.click();
    await fixture.whenStable();

    expect(profilService.majRecherchePublique).toHaveBeenCalledWith(false);
    expect(fixture.nativeElement.querySelector('#confidentialite').textContent).toContain('n’apparaissez plus');
  });

  it('garde les onglets sur la route des paramètres', () => {
    fixture.detectChanges();
    const liens = [...fixture.nativeElement.querySelectorAll('.onglets a')]
      .map((lien: HTMLAnchorElement) => lien.getAttribute('href'));

    expect(liens).toEqual([
      '/profil/parametres#profil', '/profil/parametres#parcours', '/profil/parametres#competences', '/profil/parametres#compte'
    ]);
  });

  async function ouvrirOnglet(ancre: string): Promise<void> {
    await TestBed.inject(Router).navigate([], { fragment: ancre });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function profil(): Profil {
    return {
      id: 'membre-1', nom: 'Diop', prenom: 'Awa', email: 'awa.diop@example.com',
      role: 'ALUMNI', statutCompte: 'ACTIF', bio: null, villeResidence: 'Thiès',
      posteActuel: null, lienLinkedin: null, lienPortfolio: null, urlPhoto: null,
      telephone: null, dateNaissance: null, filiere: 'GIT', classe: null, anneeSortie: 2024, recherchePublique: true,
      situationActuelle: null, paysResidence: null
    };
  }
});
