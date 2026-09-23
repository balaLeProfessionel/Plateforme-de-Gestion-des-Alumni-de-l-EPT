import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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
    expect(component['profilCharge']()).toBe(true);
    expect((fixture.nativeElement.querySelector('#secteur') as HTMLInputElement).value)
      .toBe('Télécoms');
    expect(fixture.nativeElement.textContent).toContain('Profil de mon organisme');
    expect(fixture.nativeElement.textContent).toContain('Enregistrer les modifications');
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
