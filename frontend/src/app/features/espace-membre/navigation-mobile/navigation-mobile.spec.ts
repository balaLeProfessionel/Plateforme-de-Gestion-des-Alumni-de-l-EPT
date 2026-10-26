import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { CompteurInscriptions } from '../../../core/services/admin/compteur-inscriptions';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { NavigationMobile } from './navigation-mobile';

describe('Navigation mobile', () => {
  const demandesEnAttente = signal(0);
  const inscriptionsEnAttente = signal(0);
  const role = signal('ALUMNI');

  beforeEach(() => {
    demandesEnAttente.set(0);
    inscriptionsEnAttente.set(0);
    role.set('ALUMNI');
    TestBed.configureTestingModule({
      imports: [NavigationMobile],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: CompteurDemandesMentorat, useValue: { nombre: demandesEnAttente } },
        { provide: CompteurInscriptions, useValue: { nombre: inscriptionsEnAttente } },
        { provide: AuthService, useValue: { aPermission: () => role() === 'ADMIN' } }
      ]
    });
  });

  it('mène l’administration à son tableau de bord et compte ses inscriptions dans « Menu »', async () => {
    role.set('ADMIN');
    inscriptionsEnAttente.set(19);
    demandesEnAttente.set(2);
    const fixture = TestBed.createComponent(NavigationMobile);
    const routeur = TestBed.inject(Router);
    await routeur.navigateByUrl('/admin');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const accueil = racine.querySelector('.navigation-mobile a') as HTMLAnchorElement;
    const menu = racine.querySelector('.navigation-mobile button') as HTMLButtonElement;

    expect(accueil.getAttribute('href')).toBe('/admin');
    expect(accueil.getAttribute('aria-current')).toBe('page');
    expect(menu.getAttribute('aria-current')).toBeNull();
    expect(menu.querySelector('.pastille')?.textContent).toBe('19');
    expect(menu.textContent).toContain('19 inscriptions à examiner');

    await routeur.navigateByUrl('/admin/comptes');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(accueil.getAttribute('aria-current')).toBeNull();
    expect(menu.getAttribute('aria-current')).toBe('page');
  });

  it('relie les écrans existants et bascule le menu « Mon espace »', () => {
    const fixture = TestBed.createComponent(NavigationMobile);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const menu = racine.querySelector('.navigation-mobile button') as HTMLButtonElement;

    expect([...racine.querySelectorAll('.navigation-mobile a')].map((lien) => lien.getAttribute('href')))
      .toEqual(['/accueil', '/annuaire', '/evenements']);
    expect(menu.getAttribute('aria-controls')).toBe('menu-mobile');
    expect(menu.getAttribute('aria-haspopup')).toBe('dialog');
    expect(menu.getAttribute('aria-expanded')).toBe('false');

    menu.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOuvert()).toBe(true);
    expect(menu.getAttribute('aria-expanded')).toBe('true');
    expect(racine.querySelector('.navigation-mobile')?.classList).toContain('menu-ouvert');

    (racine.querySelector('.navigation-mobile a') as HTMLAnchorElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOuvert()).toBe(false);
    expect(menu.getAttribute('aria-expanded')).toBe('false');
  });

  it('signale les pages du compte comme page courante du bouton Menu', async () => {
    const fixture = TestBed.createComponent(NavigationMobile);
    fixture.detectChanges();
    const menu = (fixture.nativeElement as HTMLElement).querySelector('.navigation-mobile button') as HTMLButtonElement;
    expect(menu.getAttribute('aria-current')).toBeNull();

    await TestBed.inject(Router).navigateByUrl('/profil/parametres');
    fixture.detectChanges();

    expect(menu.getAttribute('aria-current')).toBe('page');
    expect(menu.classList).toContain('actif');
  });

  it('signale le mentorat comme page du bouton Menu et ses demandes en attente', async () => {
    demandesEnAttente.set(2);
    const fixture = TestBed.createComponent(NavigationMobile);
    fixture.detectChanges();
    const menu = (fixture.nativeElement as HTMLElement).querySelector('.navigation-mobile button') as HTMLButtonElement;
    expect(menu.querySelector('.pastille')?.textContent?.trim()).toBe('2');
    expect(menu.textContent).toContain('2 demandes de mentorat en attente');

    await TestBed.inject(Router).navigateByUrl('/mentorat/recues');
    fixture.detectChanges();
    expect(menu.getAttribute('aria-current')).toBe('page');
  });
});
