import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, RouterStateSnapshot } from '@angular/router';

import { AuthService } from '../../../core/services/auth/auth-service';
import { titreProfil } from './titre-profil';

describe('titreProfil', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } }],
    });
  });

  it.each([
    ['moi', 'Mon profil | EPT Alumni'],
    ['autre', 'Profil membre | EPT Alumni'],
  ])('donne le titre de l’onglet pour /profil/%s', (id, titre) => {
    const route = { paramMap: convertToParamMap({ id }) } as ActivatedRouteSnapshot;
    expect(TestBed.runInInjectionContext(() => titreProfil(route, {} as RouterStateSnapshot))).toBe(titre);
  });
});
