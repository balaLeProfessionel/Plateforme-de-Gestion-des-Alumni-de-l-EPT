import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthResponse } from '../models/auth-response.model';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const utilisateur: AuthResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    id: 'utilisateur-id',
    email: 'awa.diop@example.com',
    nom: 'Diop',
    prenom: 'Awa',
    role: 'ALUMNI',
    statutCompte: 'ACTIF',
    doitChangerMotDePasse: false
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stocke la session apres connexion', () => {
    service.login(utilisateur.email, 'MotDePasse2026!').subscribe();
    http.expectOne('/api/auth/login').flush(utilisateur);

    expect(service.getToken()).toBe('access-token');
    expect(service.getRefreshToken()).toBe('refresh-token');
    expect(service.utilisateur()?.email).toBe(utilisateur.email);
  });

  it('efface la session lors de la deconnexion', () => {
    service.stocker(utilisateur);
    service.logout();

    http.expectOne('/api/auth/logout').flush(null);
    expect(service.estConnecte()).toBe(false);
    expect(service.getToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
  });

  it('envoie le refresh token pour renouveler l acces', () => {
    service.stocker(utilisateur);
    service.rafraichir().subscribe();

    const requete = http.expectOne('/api/auth/refresh');
    expect(requete.request.body).toEqual({ refreshToken: 'refresh-token' });
    requete.flush({ ...utilisateur, accessToken: 'nouvel-access-token' });
  });

  it('envoie les donnees de reinitialisation attendues', () => {
    service.reinitialiserMotDePasse(
      utilisateur.email, '123456', 'NouveauPass2026!'
    ).subscribe();

    const requete = http.expectOne('/api/auth/reinitialiser-mot-de-passe');
    expect(requete.request.body).toEqual({
      email: utilisateur.email,
      code: '123456',
      nouveauMotDePasse: 'NouveauPass2026!'
    });
    requete.flush({ message: 'Mot de passe réinitialisé' });
  });

  it('remplace la session après un changement volontaire du mot de passe', () => {
    service.stocker(utilisateur);
    service.changerMotDePasse('AncienPass2026!', 'NouveauPass2026!').subscribe();

    const requete = http.expectOne('/api/auth/changer-mot-de-passe');
    expect(requete.request.body).toEqual({
      motDePasseActuel: 'AncienPass2026!', nouveauMotDePasse: 'NouveauPass2026!'
    });
    requete.flush({ ...utilisateur, accessToken: 'nouvel-access', refreshToken: 'nouveau-refresh' });
    expect(service.getToken()).toBe('nouvel-access');
    expect(service.getRefreshToken()).toBe('nouveau-refresh');
  });

  it('synchronise l identité et la photo dans la session locale', () => {
    service.stocker(utilisateur);
    service.synchroniserProfil({ nom: 'Ndiaye', prenom: 'Aminata', urlPhoto: '/api/photos/photo.png' });

    expect(service.utilisateur()).toEqual(expect.objectContaining({
      nom: 'Ndiaye', prenom: 'Aminata', urlPhoto: '/api/photos/photo.png'
    }));
  });
});
