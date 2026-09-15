import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { ReinitialiserMotDePasse } from './reinitialiser-mot-de-passe';

describe('ReinitialiserMotDePasse', () => {
  let component: ReinitialiserMotDePasse;
  let fixture: ComponentFixture<ReinitialiserMotDePasse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReinitialiserMotDePasse],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ email: 'awa.diop@example.com' })
            }
          }
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(ReinitialiserMotDePasse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('refuse deux mots de passe differents sans appeler le serveur', () => {
    const http = TestBed.inject(HttpTestingController);
    component['modele'].set({
      code: '123456',
      nouveauMotDePasse: 'NouveauPass2026!',
      confirmation: 'AutrePass2026!'
    });

    component['reinitialiser']();

    expect(component['messageErreur']()).toBe('Les mots de passe ne correspondent pas.');
    http.verify();
  });

  it('reinitialise puis retourne a la connexion', () => {
    const http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component['modele'].set({
      code: '123456',
      nouveauMotDePasse: 'NouveauPass2026!',
      confirmation: 'NouveauPass2026!'
    });

    component['reinitialiser']();

    const requete = http.expectOne('/api/auth/reinitialiser-mot-de-passe');
    expect(requete.request.body).toEqual({
      email: 'awa.diop@example.com',
      code: '123456',
      nouveauMotDePasse: 'NouveauPass2026!'
    });
    requete.flush({ message: 'Mot de passe réinitialisé' });
    expect(navigation).toHaveBeenCalledWith(['/connexion'], {
      state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' }
    });
  });
});
