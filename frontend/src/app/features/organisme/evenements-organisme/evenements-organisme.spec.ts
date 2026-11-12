import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement, PageEvenements } from '../../../core/services/models/evenement';
import { EvenementsOrganisme } from './evenements-organisme';

function evenement(id: string): Evenement {
  return {
    id, titre: `Forum ${id}`, description: 'Description', lieu: 'Dakar', urlImage: null,
    dateDebut: '2026-12-01T09:00:00Z', dateFin: null, audience: 'TOUS', nombrePlaces: null, officielEpt: false,
    statut: 'PUBLIE', organisateurId: 'compte', organisateurNom: 'Société',
  } as Evenement;
}

function page(contenu: Evenement[], total = contenu.length): PageEvenements {
  return { contenu, page: 0, taille: 4, totalElements: total, totalPages: 1 };
}

describe('Événements organisés par un organisme', () => {
  const lister = vi.fn();

  beforeEach(() => {
    lister.mockReset();
    TestBed.configureTestingModule({
      imports: [EvenementsOrganisme],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: EvenementService, useValue: { lister } },
      ],
    });
  });

  function creer(estMaFiche = false) {
    const fixture = TestBed.createComponent(EvenementsOrganisme);
    fixture.componentRef.setInput('organismeId', 'org-1');
    fixture.componentRef.setInput('estMaFiche', estMaFiche);
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement };
  }

  it('montre les événements à venir de l’organisme', () => {
    lister.mockReturnValue(of(page([evenement('a')], 5)));
    const { racine } = creer();

    expect(lister).toHaveBeenCalledWith('AVENIR', 0, { recherche: '', lieu: '', officiel: '', organisme: 'org-1' }, 4);
    expect(racine.querySelector('.resume')?.textContent).toContain('5 événements à venir.');
    expect(racine.querySelector('h3 a')?.getAttribute('href')).toBe('/evenements/a');
  });

  it('se rabat sur les événements passés, puis disparaît s’il n’y en a aucun', () => {
    lister.mockReturnValueOnce(of(page([]))).mockReturnValueOnce(of(page([evenement('b')])));
    const { racine } = creer();
    expect(lister).toHaveBeenLastCalledWith('PASSES', 0, expect.objectContaining({ organisme: 'org-1' }), 3);
    expect(racine.querySelector('.resume')?.textContent).toContain('Aucun événement à venir');

    lister.mockReset().mockReturnValue(of(page([])));
    const autre = creer();
    expect(autre.racine.querySelector('section')).toBeNull();
  });

  it('invite l’organisme à créer son premier événement et signale une erreur', () => {
    lister.mockReturnValue(of(page([])));
    const { racine } = creer(true);
    expect(racine.querySelector('a.creer')?.getAttribute('href')).toBe('/evenements/creer');

    lister.mockReset().mockReturnValue(throwError(() => new Error('panne')));
    const enErreur = creer();
    expect(enErreur.racine.querySelector('[role="alert"]')?.textContent).toContain('n’ont pas pu être chargés');
  });
});
