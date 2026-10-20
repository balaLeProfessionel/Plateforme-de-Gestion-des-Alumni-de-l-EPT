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

    expect(liens).toEqual(['/accueil', '/annuaire', '/profil', '/evenements', '/profil/parametres']);
    expect(racine.querySelectorAll('.navigation-principale .a-venir')).toHaveLength(3);
    expect(racine.querySelector('.navigation-principale .a-venir a')).toBeNull();
    expect(racine.querySelector('.compte-lateral .lien-avatar')?.getAttribute('href')).toBe('/profil');
    expect(racine.querySelector('.entete-mobile .bouton-compte')?.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('ouvre le menu mobile et n’y rend cliquables que les actions disponibles', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const menu = racine.querySelector('.navigation-mobile button') as HTMLButtonElement;
    const dialogue = racine.querySelector('#menu-mobile') as HTMLDialogElement;
    simulerDialogueNatif(dialogue);

    menu.click();
    fixture.detectChanges();

    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(dialogue.open).toBe(true);
    expect(racine.querySelectorAll('.menu-mobile .rubrique-a-venir')).toHaveLength(3);
    expect(racine.querySelector('.menu-mobile a[href="/profil"]')?.textContent).toContain('Mon profil');
    expect(racine.querySelector('.menu-mobile a[href="/profil/parametres"]')?.getAttribute('href'))
      .toBe('/profil/parametres');
    expect([...racine.querySelectorAll('.navigation-mobile a')].map((lien) => lien.getAttribute('href')))
      .toEqual(['/accueil', '/annuaire', '/evenements']);

    (racine.querySelector('.fermer-menu') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(dialogue.open).toBe(false);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('synchronise la fermeture native du menu avec les boutons d’ouverture', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const compte = racine.querySelector('.bouton-compte') as HTMLButtonElement;
    const dialogue = racine.querySelector('#menu-mobile') as HTMLDialogElement;
    simulerDialogueNatif(dialogue);
    const defilementInitial = document.documentElement.style.overflow;

    compte.click();
    fixture.detectChanges();
    expect(document.documentElement.style.overflow).toBe('hidden');
    dialogue.dispatchEvent(new Event('cancel'));
    fixture.detectChanges();

    expect(dialogue.open).toBe(false);
    expect(compte.getAttribute('aria-expanded')).toBe('false');
    expect(racine.querySelector('.navigation-mobile button')?.getAttribute('aria-expanded')).toBe('false');
    expect(document.documentElement.style.overflow).toBe(defilementInitial);
  });

  it('permet de replier et déplier la barre latérale avec un contrôle accessible', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const bascule = racine.querySelector('.bouton-basculer-navigation') as HTMLButtonElement;
    const etatInitial = bascule.getAttribute('aria-expanded');

    bascule.click();
    fixture.detectChanges();

    expect(bascule.getAttribute('aria-expanded')).not.toBe(etatInitial);
    expect(racine.querySelector('.espace-membre')?.classList.contains('barre-repliee'))
      .toBe(bascule.getAttribute('aria-expanded') === 'false');
    expect(bascule.getAttribute('aria-label')).toMatch(/navigation/);
    expect(racine.querySelector('#navigation-principale')).not.toBeNull();
  });

  it('ferme le menu et restaure le défilement au passage sur ordinateur', () => {
    const formatMobile = new EventTarget();
    let mobile = true;
    Object.defineProperty(formatMobile, 'matches', { get: () => mobile });
    vi.stubGlobal('matchMedia', vi.fn(() => formatMobile));
    const fixture = TestBed.createComponent(EspaceMembre);
    try {
      fixture.detectChanges();
      const racine = fixture.nativeElement as HTMLElement;
      const dialogue = racine.querySelector('#menu-mobile') as HTMLDialogElement;
      simulerDialogueNatif(dialogue);
      const defilementInitial = document.documentElement.style.overflow;
      (racine.querySelector('.navigation-mobile button') as HTMLButtonElement).click();
      fixture.detectChanges();

      mobile = false;
      formatMobile.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(dialogue.open).toBe(false);
      expect(document.documentElement.style.overflow).toBe(defilementInitial);
      expect(racine.querySelector('.navigation-mobile button')?.getAttribute('aria-expanded')).toBe('false');
    } finally {
      fixture.destroy();
      vi.unstubAllGlobals();
    }
  });

  it('adapte les liens au type de compte', () => {
    utilisateur.set({ role: 'ORGANISME', nom: 'EPT', prenom: '' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('a[aria-label="Mon profil"]')?.getAttribute('href'))
      .toBe('/organisme/parametres');
    expect(racine.querySelector('a[aria-label="Paramètres du profil"]')).toBeNull();
    expect(racine.querySelector('.compte-lateral .lien-avatar')?.getAttribute('href'))
      .toBe('/organisme/parametres');
    expect(racine.querySelector('.menu-mobile a')?.getAttribute('href'))
      .toBe('/organisme/parametres');
  });

  it('n’affiche pas de lien de profil indisponible pour l’administration', () => {
    utilisateur.set({ role: 'ADMIN', nom: 'EPT', prenom: 'Admin' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelectorAll('.menu-mobile a')).toHaveLength(0);
    expect(racine.querySelectorAll('.navigation-mobile a')).toHaveLength(3);
    expect(racine.querySelector('.deconnexion-menu')).not.toBeNull();
  });
});

function simulerDialogueNatif(dialogue: HTMLDialogElement): void {
  dialogue.showModal = vi.fn(() => { dialogue.open = true; });
  dialogue.close = vi.fn(() => {
    dialogue.open = false;
    dialogue.dispatchEvent(new Event('close'));
  });
}
