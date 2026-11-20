import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { simulerDialogue } from '../../../testing/dialogue';
import { MenuPublication } from './menu-publication';

describe('MenuPublication', () => {
  beforeEach(() => {
    simulerDialogue();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  });

  async function creer(peutSignaler = true) {
    const fixture = TestBed.createComponent(MenuPublication);
    fixture.componentRef.setInput('publicationId', 'p1');
    fixture.componentRef.setInput('peutSignaler', peutSignaler);
    fixture.detectChanges();
    const racine: HTMLElement = fixture.nativeElement;
    document.body.appendChild(racine);
    const declencheur = racine.querySelector('.declencheur') as HTMLButtonElement;
    return { fixture, racine, declencheur };
  }

  afterEach(() => document.body.querySelectorAll('app-menu-publication').forEach((e) => e.remove()));

  it('s’ouvre au clavier sur le premier élément, se parcourt aux flèches et se ferme avec Échap', async () => {
    const { fixture, racine, declencheur } = await creer();
    expect(declencheur.getAttribute('aria-label')).toBe('Plus d’actions sur cette publication');
    declencheur.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    await fixture.whenStable();
    const elements = [...racine.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')];
    expect(elements.map((e) => e.textContent?.trim())).toEqual(['Partager', 'Signaler']);
    expect(declencheur.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(elements[0]);
    racine.querySelector('[role="menu"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(elements[1]);
    racine.querySelector('[role="menu"]')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(elements[0]);
    racine.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(racine.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(declencheur);
  });

  it('copie le lien de la publication et le confirme', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: ecrire }, share: undefined });
    try {
      const { fixture, racine, declencheur } = await creer(false);
      declencheur.click();
      fixture.detectChanges();
      expect(racine.querySelectorAll('[role="menuitem"]').length).toBe(1);
      (racine.querySelector('[role="menuitem"]') as HTMLButtonElement).click();
      await Promise.resolve();
      fixture.detectChanges();
      expect(ecrire).toHaveBeenCalledWith(expect.stringMatching(/\/publications\/p1$/));
      expect(racine.querySelector('[role="status"]')?.textContent).toContain('Lien copié');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('ouvre la fenêtre de signalement depuis le menu', async () => {
    const { fixture, racine, declencheur } = await creer();
    declencheur.click();
    fixture.detectChanges();
    (racine.querySelectorAll('[role="menuitem"]')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(racine.querySelector('[role="menu"]')).toBeNull();
    expect(racine.querySelector('dialog')?.open).toBe(true);
  });
});
