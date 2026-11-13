import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { NotificationService } from '../../../core/services/notifications/notifications';
import { Notification, PageNotifications as Page } from '../../../core/services/models/notification.model';
import { PageNotifications } from './page-notifications';

const JOUR = 24 * 60 * 60 * 1000;

function notification(id: string, ilYa: number, champs: Partial<Notification> = {}): Notification {
  return {
    id, type: 'MENTORAT', titre: `Titre ${id}`, message: `Message ${id}`, lien: null, lue: true,
    creeLe: new Date(Date.now() - ilYa).toISOString(), ...champs,
  };
}

function page(contenu: Notification[], numero = 0, totalPages = 1): Page {
  return { contenu, page: numero, taille: 20, totalElements: contenu.length, totalPages, nonLues: 1 };
}

describe('Page des notifications', () => {
  const nonLues = signal(1);
  const lister = vi.fn();
  const marquerLue = vi.fn();
  const toutMarquerLu = vi.fn();

  beforeEach(() => {
    nonLues.set(1);
    lister.mockReset();
    marquerLue.mockReset().mockReturnValue(of(undefined));
    toutMarquerLu.mockReset().mockImplementation(() => {
      nonLues.set(0);
      return of(undefined);
    });
    TestBed.configureTestingModule({
      imports: [PageNotifications],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: NotificationService, useValue: { nonLues, lister, marquerLue, toutMarquerLu } },
      ],
    });
  });

  function creer() {
    const fixture = TestBed.createComponent(PageNotifications);
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement };
  }

  it('regroupe les notifications par période et charge la suite', () => {
    lister
      .mockReturnValueOnce(of(page([
        notification('a', 60_000, { lue: false }),
        notification('b', 3 * JOUR),
        notification('c', 30 * JOUR),
      ], 0, 2)))
      .mockReturnValueOnce(of(page([notification('d', 40 * JOUR)], 1, 2)));
    const { fixture, racine } = creer();

    expect(lister).toHaveBeenCalledWith(0, 20, false);
    expect(racine.querySelector('p')?.textContent).toContain('1 notification non lue.');
    expect([...racine.querySelectorAll('.groupe h2')].map((titre) => titre.textContent))
      .toEqual(['Aujourd’hui', 'Cette semaine', 'Plus anciennes']);

    (racine.querySelector('.plus') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(lister).toHaveBeenLastCalledWith(1, 20, false);
    expect(racine.querySelectorAll('app-ligne-notification')).toHaveLength(4);
    expect(racine.querySelectorAll('.groupe')).toHaveLength(3);
    expect(racine.querySelector('.plus')).toBeNull();
  });

  it('filtre les non lues, marque lue la notification ouverte et tout le reste', () => {
    lister.mockReturnValueOnce(of(page([notification('a', 60_000)])))
      .mockReturnValueOnce(of(page([notification('b', 60_000, { lue: false })])));
    const { fixture, racine } = creer();

    const [toutes, nonLuesFiltre] = racine.querySelectorAll<HTMLButtonElement>('.filtres button');
    nonLuesFiltre.click();
    fixture.detectChanges();
    expect(lister).toHaveBeenLastCalledWith(0, 20, true);
    expect(nonLuesFiltre.getAttribute('aria-pressed')).toBe('true');
    expect(toutes.getAttribute('aria-pressed')).toBe('false');

    (racine.querySelector('app-ligne-notification.non-lue button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(marquerLue).toHaveBeenCalledWith('b');
    // La notification ouverte reste visible pour ne pas faire sauter la liste.
    expect(racine.querySelectorAll('app-ligne-notification')).toHaveLength(1);

    (racine.querySelector('.tout-lire') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(toutMarquerLu).toHaveBeenCalled();
    expect(racine.querySelector('.tout-lire')).toBeNull();
    expect(racine.querySelector('p')?.textContent).toContain('Vous êtes à jour.');
  });

  it('distingue la liste vide, le filtre vide et l’erreur', () => {
    lister.mockReturnValueOnce(throwError(() => new Error('panne')))
      .mockReturnValueOnce(of(page([])))
      .mockReturnValueOnce(of(page([])));
    const { fixture, racine } = creer();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('n’ont pas pu être chargées');

    (racine.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('.etat.vide')?.textContent).toContain('Aucune notification pour l’instant');

    racine.querySelectorAll<HTMLButtonElement>('.filtres button')[1].click();
    fixture.detectChanges();
    expect(racine.querySelector('.etat.vide')?.textContent).toContain('Aucune notification non lue');
  });
});
