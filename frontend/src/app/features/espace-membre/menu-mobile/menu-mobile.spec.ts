import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { MenuMobile } from './menu-mobile';

describe('Menu mobile « Mon espace »', () => {
  const rubriques = [
    { libelle: 'Mentorat', icone: 'pi-sitemap' },
    { libelle: 'Offres d’emploi', icone: 'pi-briefcase' },
    { libelle: 'Actualités', icone: 'pi-megaphone' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MenuMobile],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
  });

  function creerMenu(lienProfil: string | null, lienParametres: string | null) {
    const fixture = TestBed.createComponent(MenuMobile);
    fixture.componentRef.setInput('lienProfil', lienProfil);
    fixture.componentRef.setInput('lienParametres', lienParametres);
    fixture.componentRef.setInput('rubriques', rubriques);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const dialogue = racine.querySelector('#menu-mobile') as HTMLDialogElement;
    simulerDialogueNatif(dialogue);
    return { fixture, racine, dialogue };
  }

  function ouvrir(fixture: ComponentFixture<MenuMobile>): void {
    fixture.componentRef.setInput('ouvert', true);
    fixture.detectChanges();
  }

  it('s’ouvre en modal et n’y rend cliquables que les actions disponibles', () => {
    const { fixture, racine, dialogue } = creerMenu('/profil', '/profil/parametres');
    const defilementInitial = document.documentElement.style.overflow;

    ouvrir(fixture);

    expect(dialogue.open).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(dialogue.getAttribute('aria-labelledby')).toBe('titre-menu-mobile');
    expect(racine.querySelectorAll('.rubrique-a-venir')).toHaveLength(3);
    expect(racine.querySelector('.menu-mobile a[href="/profil"]')?.textContent).toContain('Mon profil');
    expect(racine.querySelector('.menu-mobile a[href="/profil/parametres"]')).not.toBeNull();

    (racine.querySelector('.fermer-menu') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(dialogue.open).toBe(false);
    expect(fixture.componentInstance.ouvert()).toBe(false);
    expect(document.documentElement.style.overflow).toBe(defilementInitial);
  });

  it('garde le focus dans le menu avec Tab et Maj+Tab', () => {
    const { fixture, racine, dialogue } = creerMenu('/profil', null);
    ouvrir(fixture);
    const fermer = racine.querySelector('.fermer-menu') as HTMLButtonElement;
    const deconnexion = racine.querySelector('.deconnexion-menu') as HTMLButtonElement;

    deconnexion.focus();
    dialogue.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(fermer);

    dialogue.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(deconnexion);
    fixture.destroy();
  });

  it('ferme le menu avant de demander la déconnexion', () => {
    const { fixture, racine, dialogue } = creerMenu(null, null);
    const deconnexion = vi.fn();
    fixture.componentInstance.deconnexion.subscribe(deconnexion);
    ouvrir(fixture);

    (racine.querySelector('.deconnexion-menu') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(dialogue.open).toBe(false);
    expect(deconnexion).toHaveBeenCalledOnce();
    expect(racine.querySelectorAll('.menu-mobile a')).toHaveLength(0);
  });

  it('ferme le menu et restaure le défilement au passage sur ordinateur', () => {
    const formatMobile = new EventTarget();
    let mobile = true;
    Object.defineProperty(formatMobile, 'matches', { get: () => mobile });
    vi.stubGlobal('matchMedia', vi.fn(() => formatMobile));
    const { fixture, dialogue } = creerMenu('/profil', null);
    try {
      const defilementInitial = document.documentElement.style.overflow;
      ouvrir(fixture);

      mobile = false;
      formatMobile.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(dialogue.open).toBe(false);
      expect(document.documentElement.style.overflow).toBe(defilementInitial);
      expect(fixture.componentInstance.ouvert()).toBe(false);
    } finally {
      fixture.destroy();
      vi.unstubAllGlobals();
    }
  });
});

function simulerDialogueNatif(dialogue: HTMLDialogElement): void {
  dialogue.showModal = vi.fn(() => { dialogue.open = true; });
  dialogue.close = vi.fn(() => {
    dialogue.open = false;
    dialogue.dispatchEvent(new Event('close'));
  });
}
