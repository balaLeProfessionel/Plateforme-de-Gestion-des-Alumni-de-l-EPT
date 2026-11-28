import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../services/auth/auth-service';
import { jwtInterceptor } from './jwt.interceptors';

describe('jwtInterceptor', () => {
  const logout = vi.fn();
  const rafraichir = vi.fn();

  beforeEach(() => {
    logout.mockClear();
    rafraichir.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: { getToken: () => 'jeton', logout, rafraichir } },
      ],
    });
  });

  it('déconnecte un compte suspendu pendant sa session et explique pourquoi, sans tenter de rafraîchir', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    let echec = false;
    TestBed.inject(HttpClient).get('/api/evenements').subscribe({ error: () => (echec = true) });

    const requete = TestBed.inject(HttpTestingController).expectOne('/api/evenements');
    expect(requete.request.headers.get('Authorization')).toBe('Bearer jeton');
    requete.flush({ code: 'COMPTE_SUSPENDU', message: 'Votre compte a été suspendu. Contactez l’administration.' },
      { status: 401, statusText: 'Unauthorized' });

    expect(echec).toBe(true);
    expect(logout).toHaveBeenCalledOnce();
    expect(rafraichir).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/connexion'],
      { state: { erreur: 'Votre compte a été suspendu. Contactez l’administration.' } });
  });

  it('sur une route publique, une session expirée est oubliée sans quitter la page', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    rafraichir.mockReturnValue(throwError(() => new Error('refresh expiré')));
    let filieres: unknown = null;
    TestBed.inject(HttpClient).get('/api/public/filieres').subscribe((r) => (filieres = r));

    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/public/filieres').flush(null, { status: 401, statusText: 'Unauthorized' });
    const rejouee = http.expectOne('/api/public/filieres');
    expect(rejouee.request.headers.has('Authorization')).toBe(false);
    rejouee.flush([{ id: 1, nom: 'Génie informatique' }]);

    expect(filieres).toEqual([{ id: 1, nom: 'Génie informatique' }]);
    expect(logout).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });
});
