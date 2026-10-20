import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { NavigationMobile } from './navigation-mobile';

describe('Navigation mobile', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NavigationMobile],
      providers: [provideRouter([{ path: '**', children: [] }])]
    });
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
});
