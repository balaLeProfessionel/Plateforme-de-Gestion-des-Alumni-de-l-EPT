import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { MembreOrganisme, PageMembresOrganisme } from '../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { DialogueMembresOrganisme } from './dialogue-membres-organisme';

function membre(id: string, actuel = true): MembreOrganisme {
  return {
    id, prenom: `Prénom ${id}`, nom: `Nom ${id}`, urlPhoto: null, role: 'ALUMNI', poste: 'Ingénieur',
    actuel, anneeDebut: 2020, anneeFin: actuel ? null : 2022,
  };
}

function page(contenu: MembreOrganisme[], total: number, numero = 0): PageMembresOrganisme {
  return { contenu, page: numero, taille: 20, totalElements: total, totalPages: Math.ceil(total / 20), actuels: 1, anciens: 24 };
}

describe('Fenêtre des membres d’un organisme', () => {
  const listerMembres = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    listerMembres.mockReset();
    TestBed.configureTestingModule({
      imports: [DialogueMembresOrganisme],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: OrganismeService, useValue: { listerMembres } },
      ],
    });
  });

  afterEach(() => vi.useRealTimers());

  async function ouvrir() {
    const fixture = TestBed.createComponent(DialogueMembresOrganisme);
    fixture.componentRef.setInput('organismeId', 'org-1');
    fixture.componentRef.setInput('presenceInitiale', 'ANCIENS');
    fixture.componentRef.setInput('ouverte', true);
    fixture.detectChanges();
    await vi.runAllTimersAsync();
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement };
  }

  it('part du filtre de l’onglet, change de filtre, cherche et charge la suite', async () => {
    listerMembres.mockReturnValue(of(page([membre('a', false)], 21)));
    const { fixture, racine } = await ouvrir();

    expect(listerMembres).toHaveBeenCalledWith('org-1', 0, 20, 'ANCIENS', '');
    const filtres = racine.querySelectorAll<HTMLButtonElement>('.filtres button');
    expect([...filtres].map((bouton) => bouton.textContent?.replace(/\s+/g, ' ').trim()))
      .toEqual(['Tous 25', 'Actuellement 1', 'Anciens 24']);
    expect(filtres[2].getAttribute('aria-pressed')).toBe('true');
    expect(racine.querySelector('li a')?.getAttribute('href')).toBe('/profil/a');

    filtres[0].click();
    await vi.runAllTimersAsync();
    fixture.detectChanges();
    expect(listerMembres).toHaveBeenLastCalledWith('org-1', 0, 20, null, '');

    const champ = racine.querySelector('input') as HTMLInputElement;
    champ.value = 'awa';
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(listerMembres).toHaveBeenLastCalledWith('org-1', 0, 20, null, 'awa');

    listerMembres.mockReturnValueOnce(of(page([membre('b')], 21, 1)));
    (racine.querySelector('.plus') as HTMLButtonElement).click();
    await vi.runAllTimersAsync();
    fixture.detectChanges();
    expect(listerMembres).toHaveBeenLastCalledWith('org-1', 1, 20, null, 'awa');
    expect(racine.querySelectorAll('li')).toHaveLength(2);
    expect(racine.querySelector('.en-poste')).not.toBeNull();
  });
});
