import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';

import { Connexion } from './connexion';

describe('Connexion', () => {
  let component: Connexion;
  let fixture: ComponentFixture<Connexion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Connexion],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Connexion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('redirige un etudiant vers le changement du mot de passe initial', () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['modele'].set({ email: 'awa.diop@example.com', password: 'Temporaire2026' });

    component.seConnecter();

    http.expectOne('/api/auth/login').flush({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      id: 'utilisateur-id',
      email: 'awa.diop@example.com',
      nom: 'Diop',
      prenom: 'Awa',
      role: 'ETUDIANT',
      statutCompte: 'ACTIF',
      doitChangerMotDePasse: true
    });
    expect(navigation).toHaveBeenCalledWith(['/premiere-connexion']);
  });
});
