import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { NotificationService } from '../../../core/services/notifications/notifications';
import { Notification, PageNotifications } from '../../../core/services/models/notification.model';
import { ClocheNotifications } from './cloche-notifications';

function notification(id: string, champs: Partial<Notification> = {}): Notification {
  return {
    id, type: 'EVENEMENT', titre: `Titre ${id}`, message: `Message ${id}`,
    lien: `/evenements/${id}`, lue: false, creeLe: '2026-11-08T10:00:00Z', ...champs,
  };
}

function page(contenu: Notification[], nonLues = 1): PageNotifications {
  return { contenu, page: 0, taille: 6, totalElements: contenu.length, totalPages: 1, nonLues };
}

describe('Cloche des notifications', () => {
  const nonLues = signal(0);
  const lister = vi.fn();
  const marquerLue = vi.fn();
  const toutMarquerLu = vi.fn();

  beforeEach(() => {
    nonLues.set(0);
    lister.mockReset();
    marquerLue.mockReset().mockReturnValue(of(undefined));
    toutMarquerLu.mockReset().mockImplementation(() => {
      nonLues.set(0);
      return of(undefined);
    });
    TestBed.configureTestingModule({
      imports: [ClocheNotifications],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: NotificationService, useValue: { nonLues, lister, marquerLue, toutMarquerLu } },
      ],
    });
  });

  function creer(mode: 'panneau' | 'lien' = 'panneau') {
    const fixture = TestBed.createComponent(ClocheNotifications);
    fixture.componentRef.setInput('identifiant', 'notifications-test');
    fixture.componentRef.setInput('mode', mode);
    fixture.detectChanges();
    const racine = fixture.nativeElement as HTMLElement;
    const bouton = racine.querySelector('.bouton-cloche') as HTMLElement;
    return { fixture, racine, bouton };
  }

  it('annonce les non lues et affiche une pastille plafonnée', () => {
    const { fixture, racine, bouton } = creer();
    expect(bouton.getAttribute('aria-label')).toBe('Notifications');
    expect(racine.querySelector('.badge')).toBeNull();

    nonLues.set(120);
    fixture.detectChanges();
    expect(bouton.getAttribute('aria-label')).toBe('Notifications, 120 non lues');
    expect(racine.querySelector('.badge')?.textContent?.trim()).toBe('99+');
  });

  it('mène directement à la page en mode lien, sans panneau', () => {
    nonLues.set(2);
    const { bouton } = creer('lien');
    expect(bouton.tagName).toBe('A');
    expect(bouton.getAttribute('href')).toBe('/notifications');
    expect(bouton.getAttribute('aria-label')).toBe('Notifications, 2 non lues');
    expect(lister).not.toHaveBeenCalled();
  });

  it('ouvre un aperçu des dernières notifications et marque lue celle qu’on ouvre', () => {
    nonLues.set(1);
    lister.mockReturnValue(of(page([notification('a'), notification('b', { lue: true, lien: null })])));
    const { fixture, racine, bouton } = creer();

    bouton.click();
    fixture.detectChanges();
    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    expect(lister).toHaveBeenCalledWith(0, 6);
    expect(racine.querySelectorAll('.liste li')).toHaveLength(2);
    expect(racine.querySelector('app-ligne-notification.non-lue a')?.getAttribute('href')).toBe('/evenements/a');
    expect(racine.querySelector('app-ligne-notification:not(.non-lue) button')).not.toBeNull();
    expect(racine.querySelector('.tout-voir')?.getAttribute('href')).toBe('/notifications');

    (racine.querySelector('app-ligne-notification.non-lue a') as HTMLAnchorElement).click();
    fixture.detectChanges();
    expect(marquerLue).toHaveBeenCalledWith('a');
    expect(racine.querySelector('.panneau')).toBeNull();
  });

  it('marque tout comme lu, se ferme avec Échap et rend le focus', () => {
    nonLues.set(1);
    lister.mockReturnValue(of(page([notification('a')])));
    const { fixture, racine, bouton } = creer();
    bouton.click();
    fixture.detectChanges();

    (racine.querySelector('.entete-panneau .lien-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(toutMarquerLu).toHaveBeenCalled();
    expect(racine.querySelector('app-ligne-notification.non-lue')).toBeNull();
    expect(racine.querySelector('.entete-panneau .lien-action')).toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(racine.querySelector('.panneau')).toBeNull();
    expect(document.activeElement).toBe(bouton);
  });

  it('se ferme sur un clic extérieur et propose de réessayer après une erreur', () => {
    lister.mockReturnValueOnce(throwError(() => new Error('panne'))).mockReturnValueOnce(of(page([])));
    const { fixture, racine, bouton } = creer();
    document.body.appendChild(racine);
    bouton.click();
    fixture.detectChanges();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('n’ont pas pu être chargées');

    (racine.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('.etat.vide')?.textContent).toContain('Rien de nouveau');

    document.body.click();
    fixture.detectChanges();
    expect(racine.querySelector('.panneau')).toBeNull();
    racine.remove();
  });
});
