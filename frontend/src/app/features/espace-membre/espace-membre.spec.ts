import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { EspaceMembre } from './espace-membre';

describe('Navigation de l’espace membre', () => {
  const utilisateur = signal<Record<string, string> | null>(null);
  const logout = vi.fn();
  const demandesEnAttente = signal(0);
  const actualiserCompteur = vi.fn();

  beforeEach(() => {
    utilisateur.set({ role: 'ALUMNI', nom: 'Diop', prenom: 'Awa' });
    logout.mockClear();
    demandesEnAttente.set(0);
    actualiserCompteur.mockClear();
    TestBed.configureTestingModule({
      imports: [EspaceMembre],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: AuthService, useValue: { utilisateur, logout } },
        { provide: CompteurDemandesMentorat, useValue: { nombre: demandesEnAttente, actualiser: actualiserCompteur } }
      ]
    });
  });

  it('relie les écrans existants et laisse les rubriques futures sans lien', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const liens = [...racine.querySelectorAll('.barre-laterale nav a')]
      .map((lien) => lien.getAttribute('href'));

    expect(liens).toEqual(['/accueil', '/annuaire', '/evenements', '/mentorat']);
    expect(racine.querySelector('.barre-laterale .marque')?.getAttribute('href')).toBe('/accueil');
    expect([...racine.querySelectorAll('.barre-laterale nav button[aria-disabled="true"]')]
      .map((lien) => lien.getAttribute('aria-label')))
      .toEqual(['Offres d’emploi, à venir', 'Actualités, à venir']);
    expect(racine.querySelector('.barre-laterale nav button[aria-disabled="true"] a')).toBeNull();
    expect(racine.querySelector('.entete-mobile .bouton-compte')?.getAttribute('aria-haspopup')).toBe('dialog');
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
    const bascule = racine.querySelector('.barre-outils button') as HTMLButtonElement;
    const sidebar = racine.querySelector('.barre-laterale') as HTMLElement;
    const etatInitial = sidebar.getAttribute('data-state');

    bascule.click();
    fixture.detectChanges();

    expect(sidebar.getAttribute('data-state')).not.toBe(etatInitial);
    expect(bascule.getAttribute('aria-label')).toMatch(/navigation/);
    expect(sidebar.hasAttribute('data-overlay')).toBe(false);
    expect(racine.querySelector('p-sidebar-backdrop')).toBeNull();
  });

  it('affiche la photo de profil dans les avatars et revient aux initiales si elle échoue', () => {
    utilisateur.set({ role: 'ALUMNI', nom: 'Diop', prenom: 'Awa', urlPhoto: '/api/photos/awa.png' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const photos = [...racine.querySelectorAll<HTMLImageElement>('p-avatar img')];

    expect(photos.map((photo) => photo.getAttribute('src'))).toEqual(['/api/photos/awa.png', '/api/photos/awa.png']);

    photos[0].dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(racine.querySelector('p-avatar img')).toBeNull();
    expect(racine.querySelector('.barre-laterale p-avatar')?.textContent?.trim()).toBe('AD');
  });

  it('regroupe profil, paramètres et déconnexion dans le menu du compte', () => {
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const compte = racine.querySelector('.bouton-compte-lateral') as HTMLButtonElement;

    expect(compte.getAttribute('aria-label')).toBe('Menu du compte de Awa Diop, Alumni');
    compte.click();
    fixture.detectChanges();

    const entrees = [...document.querySelectorAll('#menu-compte [role="menuitem"]')];
    expect(entrees.map((entree) => entree.textContent?.trim())).toEqual(['Mon profil', 'Paramètres', 'Déconnexion']);
    expect(document.querySelector('#menu-compte a[href="/profil"]')).not.toBeNull();
    expect(document.querySelector('#menu-compte a[href="/profil/parametres"]')).not.toBeNull();

    (document.querySelector('#menu-compte [role="menuitem"]:last-child a') as HTMLElement | null)?.click();
    fixture.detectChanges();
    expect(logout).toHaveBeenCalled();
    fixture.destroy();
  });

  it('adapte les liens au type de compte', () => {
    utilisateur.set({ role: 'ORGANISME', nom: 'EPT', prenom: '' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.menu-mobile a')?.getAttribute('href'))
      .toBe('/organisme/parametres');
    expect(racine.querySelector('.menu-mobile a[aria-label="Paramètres du profil"]')).toBeNull();
    (racine.querySelector('.bouton-compte-lateral') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect([...document.querySelectorAll('#menu-compte [role="menuitem"]')].map((entree) => entree.textContent?.trim()))
      .toEqual(['Mon organisme', 'Déconnexion']);
    expect(document.querySelector('#menu-compte a[href="/organisme/parametres"]')).not.toBeNull();
    fixture.destroy();
  });

  it('signale aux mentors les demandes de mentorat en attente', () => {
    demandesEnAttente.set(3);
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    expect(actualiserCompteur).toHaveBeenCalledOnce();
    expect(racine.querySelector('.badge-mentorat')?.textContent?.trim()).toBe('3');
    expect(racine.querySelector('.barre-laterale a[href="/mentorat"]')?.textContent)
      .toContain('3 demandes en attente');
    expect(racine.querySelector('.menu-mobile a[href="/mentorat"] .compteur')?.textContent?.trim()).toBe('3');
  });

  it('n’affiche pas de lien de profil indisponible pour l’administration', () => {
    utilisateur.set({ role: 'ADMIN', nom: 'EPT', prenom: 'Admin' });
    const fixture = TestBed.createComponent(EspaceMembre);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;

    // Seule la rubrique Mentorat reste : aucun lien de profil pour l'administration.
    expect([...racine.querySelectorAll('.menu-mobile a')].map((lien) => lien.getAttribute('href'))).toEqual(['/mentorat']);
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
