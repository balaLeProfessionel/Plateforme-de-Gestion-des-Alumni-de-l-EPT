import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Verification } from './verification';

describe('Verification', () => {
  let component: Verification;
  let fixture: ComponentFixture<Verification>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verification],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ email: 'test@example.com' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Verification);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('redirige un visiteur vers la completion du profil apres verification', () => {
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component['code'].set('123456');
    component.verifier();

    http.expectOne('/api/auth/verifier-otp').flush({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      id: 'utilisateur-id',
      email: 'test@example.com',
      nom: 'Visiteur',
      prenom: 'Test',
      role: 'VISITEUR',
      statutCompte: 'EN_ATTENTE'
    });

    expect(navigation).toHaveBeenCalledWith(['/completer-profil/infos']);
  });
});
