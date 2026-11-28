import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';

import { CompleterOrganisme } from './completer-organisme';

describe('CompleterOrganisme', () => {
  let component: CompleterOrganisme;
  let fixture: ComponentFixture<CompleterOrganisme>;
  const profil = {
    id: 'org-1', nom: 'Sonatel', description: 'Télécommunications',
    secteurActivite: 'Télécoms', typeOrganisme: 'ENTREPRISE' as const,
    adresse: 'Dakar', pays: 'Sénégal', siteWeb: 'https://sonatel.sn', logoUrl: null,
    statutJuridique: null, trancheEffectif: null, dateCreation: null, statutCompte: 'ACTIF' as const
  };
  const organismeService = {
    obtenirMonProfil: vi.fn().mockReturnValue(of(profil)),
    completerMonProfilOrganisme: vi.fn().mockReturnValue(of(profil))
  };

  beforeEach(async () => {
    organismeService.obtenirMonProfil.mockReturnValue(of(profil));
    organismeService.completerMonProfilOrganisme.mockClear();
    await TestBed.configureTestingModule({
      imports: [CompleterOrganisme],
      providers: [
        provideRouter([]),
        { provide: OrganismeService, useValue: organismeService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CompleterOrganisme);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('charge et affiche les informations déjà enregistrées pour son profil', () => {
    fixture.detectChanges();

    expect(organismeService.obtenirMonProfil).toHaveBeenCalled();
    expect(component['profilComplet']()).toBe(true);
    expect((fixture.nativeElement.querySelector('#secteur') as HTMLInputElement).value)
      .toBe('Télécoms');
    expect(fixture.nativeElement.textContent).toContain('Profil de mon organisme');
    expect(fixture.nativeElement.textContent).toContain('Enregistrer les modifications');
  });

  it('présente un profil vide, juste après l’inscription, comme à compléter et sans erreur', () => {
    organismeService.obtenirMonProfil.mockReturnValue(of({
      ...profil, description: null, secteurActivite: null, typeOrganisme: null
    }));
    fixture = TestBed.createComponent(CompleterOrganisme);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component['profilComplet']()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Complétez le profil de votre organisme');
    expect(fixture.nativeElement.textContent).toContain('Enregistrer et continuer');
    const secteur: HTMLInputElement = fixture.nativeElement.querySelector('#secteur');
    expect(secteur.classList).not.toContain('est-invalide');
    expect(secteur.getAttribute('aria-invalid')).toBeNull();

    component['valider']();
    fixture.detectChanges();
    expect(secteur.classList).toContain('est-invalide');
    expect(secteur.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain("Le type d'organisme est obligatoire");
  });

  it('affiche les erreurs des champs requis après une validation vide', () => {
    component['modele'].set({
      description: '', secteurActivite: '', typeOrganisme: '', adresse: '', siteWeb: '', pays: ''
    });
    component['valider']();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La description est obligatoire');
    expect(fixture.nativeElement.textContent).toContain("Le secteur d'activité est obligatoire");
    expect(organismeService.completerMonProfilOrganisme).not.toHaveBeenCalled();
  });
});

describe('CompleterOrganisme dans les paramètres', () => {
  const organismeService = {
    obtenirMonProfil: vi.fn().mockReturnValue(of({
      id: 'org-1', nom: 'Sonatel', description: 'Télécommunications', secteurActivite: 'Télécoms',
      typeOrganisme: 'ENTREPRISE' as const, adresse: null, pays: null, siteWeb: null, logoUrl: null,
      statutJuridique: null, trancheEffectif: null, dateCreation: null, statutCompte: 'ACTIF' as const
    })),
    completerMonProfilOrganisme: vi.fn()
  };

  function creer(parametres: boolean) {
    TestBed.configureTestingModule({
      imports: [CompleterOrganisme],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: OrganismeService, useValue: organismeService },
        { provide: ActivatedRoute, useValue: { snapshot: { data: parametres ? { parametres: true } : {} } } }
      ]
    });
    const fixture = TestBed.createComponent(CompleterOrganisme);
    fixture.detectChanges();
    return fixture;
  }

  it('propose la liaison Google dans les paramètres de l’organisme', () => {
    const fixture = creer(true);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/auth/google/liaison').flush({ lie: false, emailGoogle: null, motDePasseDefini: true });
    fixture.detectChanges();

    const section: HTMLElement = fixture.nativeElement.querySelector('section[aria-labelledby="titre-google"]');
    expect(section.querySelector('h2')?.textContent).toBe('Connexion avec Google');
    expect(section.querySelector('app-bouton-google')).not.toBeNull();
    http.match('/api/auth/google/configuration');
    http.verify();
  });

  it('ne la propose pas pendant la première complétion du profil', () => {
    const fixture = creer(false);
    expect(fixture.nativeElement.querySelector('app-section-google')).toBeNull();
    TestBed.inject(HttpTestingController).expectNone('/api/auth/google/liaison');
  });
});
