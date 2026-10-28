import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../core/services/auth/auth-service';
import { Accueil } from './accueil';

describe('Accueil', () => {
  it('accueille le membre et signale un profil en cours de vérification', () => {
    TestBed.configureTestingModule({
      imports: [Accueil],
      providers: [{ provide: AuthService, useValue: { utilisateur: signal({ role: 'ALUMNI', prenom: 'Awa', statutCompte: 'EN_ATTENTE' }) } }],
    });
    const fixture = TestBed.createComponent(Accueil);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('h1')?.textContent).toContain('Bienvenue Awa');
    expect(racine.querySelector('.infos')?.textContent).toContain('Alumni');
    expect(racine.querySelector('.badge-attente')).not.toBeNull();
  });
});
