import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth/auth-service';
import { EspaceMembre } from './espace-membre';

describe('Navigation de l’espace membre', () => {
  const utilisateur = signal<Record<string, string> | null>(null);
  const logout = vi.fn();

  beforeEach(() => {
    utilisateur.set({ role: 'ALUMNI', nom: 'Diop', prenom: 'Awa' });
    logout.mockClear();
    TestBed.configureTestingModule({
      imports: [EspaceMembre],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { utilisateur, logout } }
      ]
    });
  });

  it('relie les écrans existants et laisse les rubriques futures sans lien', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const liens = [...racine.querySelectorAll('.navigation-principale a')]
      .map((lien) => lien.getAttribute('href'));

    expect(liens).toEqual(['/accueil', '/annuaire', '/profil', '/profil/parametres']);
    expect(racine.querySelectorAll('.navigation-principale .a-venir')).toHaveLength(4);
    expect(racine.querySelector('.navigation-principale .a-venir a')).toBeNull();
  });

  it('ouvre le menu mobile et n’y rend cliquables que les actions disponibles', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const plus = racine.querySelector('.navigation-mobile button') as HTMLButtonElement;

    plus.click();
    fixture.detectChanges();

    expect(plus.getAttribute('aria-expanded')).toBe('true');
    expect(racine.querySelectorAll('.panneau-plus .rubrique-a-venir')).toHaveLength(4);
    expect(racine.querySelector('.panneau-plus a')?.getAttribute('href'))
      .toBe('/profil/parametres');
    expect(racine.querySelectorAll('.navigation-mobile a')).toHaveLength(3);

    plus.click();
    fixture.detectChanges();
    expect(racine.querySelector('.panneau-plus')?.hasAttribute('hidden')).toBe(true);
  });

  it('adapte les liens au type de compte', () => {
    utilisateur.set({ role: 'ORGANISME', nom: 'EPT', prenom: '' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('a[aria-label="Mon profil"]')?.getAttribute('href'))
      .toBe('/completer-organisme');
    expect(racine.querySelector('a[aria-label="Paramètres du profil"]')).toBeNull();
  });
});
