import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { PremiereConnexion } from './premiere-connexion';

describe('PremiereConnexion', () => {
  let component: PremiereConnexion;
  let fixture: ComponentFixture<PremiereConnexion>;

  beforeEach(async () => {
    localStorage.setItem('auth_refresh', 'ancien-refresh-token');
    await TestBed.configureTestingModule({
      imports: [PremiereConnexion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiereConnexion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('refuse deux mots de passe differents', () => {
    const http = TestBed.inject(HttpTestingController);
    component['modele'].set({
      nouveauMotDePasse: 'NouveauPass2026!',
      confirmation: 'AutrePass2026!'
    });

    component['enregistrer']();

    expect(component['messageErreur']()).toBe('Les mots de passe ne correspondent pas.');
    http.verify();
  });

  it('enregistre le nouveau mot de passe et ouvre la completion du profil', () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['modele'].set({
      nouveauMotDePasse: 'NouveauPass2026!',
      confirmation: 'NouveauPass2026!'
    });

    component['enregistrer']();

    http.expectOne('/api/auth/changer-mot-de-passe-initial').flush({
      accessToken: 'nouvel-access-token',
      refreshToken: 'nouveau-refresh-token',
      id: 'utilisateur-id',
      email: 'awa.diop@example.com',
      nom: 'Diop',
      prenom: 'Awa',
      role: 'ETUDIANT',
      statutCompte: 'ACTIF',
      doitChangerMotDePasse: false
    });
    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos']);
  });
});
