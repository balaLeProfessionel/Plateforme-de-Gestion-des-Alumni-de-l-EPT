import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { MembreOrganisme, PageMembresOrganisme } from '../../../core/services/models/organisme.model';
import { OrganismeService } from '../../../core/services/organisme/organisme-service';
import { DialogueMembresOrganisme } from './dialogue-membres-organisme';
import { MembresOrganisme } from './membres-organisme';

function membre(id: string, champs: Partial<MembreOrganisme> = {}): MembreOrganisme {
  return {
    id, prenom: `Prénom ${id}`, nom: `Nom ${id}`, urlPhoto: null, role: 'ALUMNI', poste: 'Ingénieur',
    actuel: true, anneeDebut: 2020, anneeFin: null, ...champs,
  };
}

function page(contenu: MembreOrganisme[], actuels: number, anciens: number, total = contenu.length): PageMembresOrganisme {
  return { contenu, page: 0, taille: 8, totalElements: total, totalPages: 1, actuels, anciens };
}

describe('Membres d’un organisme', () => {
  const listerMembres = vi.fn();

  beforeEach(() => {
    listerMembres.mockReset();
    TestBed.configureTestingModule({
      imports: [MembresOrganisme],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: OrganismeService, useValue: { listerMembres } },
      ],
    });
  });

  function creer() {
    const fixture = TestBed.createComponent(MembresOrganisme);
    fixture.componentRef.setInput('organismeId', 'org-1');
    fixture.componentRef.setInput('nomOrganisme', 'Société');
    const resumes: unknown[] = [];
    fixture.componentInstance.resumeCharge.subscribe((resume) => resumes.push(resume));
    fixture.detectChanges();
    return { fixture, racine: fixture.nativeElement as HTMLElement, resumes };
  }

  it('montre les vignettes de l’onglet choisi et ouvre la liste complète', () => {
    listerMembres
      .mockReturnValueOnce(of(page([membre('a')], 1, 12)))
      .mockReturnValueOnce(of(page([membre('b', { actuel: false, anneeDebut: 2018, anneeFin: 2023 })], 1, 12, 12)));
    const { fixture, racine, resumes } = creer();

    expect(listerMembres).toHaveBeenCalledWith('org-1', 0, 8, 'ACTUELS');
    expect(resumes).toEqual([{ actuels: 1, anciens: 12, apercu: [expect.objectContaining({ id: 'a' })] }]);
    const [actuels, anciens] = racine.querySelectorAll<HTMLButtonElement>('.onglets button');
    expect(actuels.getAttribute('aria-pressed')).toBe('true');
    expect(anciens.textContent?.replace(/\s+/g, ' ').trim()).toBe('Anciens 12');
    const vignette = racine.querySelector<HTMLAnchorElement>('a.vignette');
    expect(vignette?.getAttribute('href')).toBe('/profil/a');
    expect(vignette?.textContent).toContain('Depuis 2020');

    anciens.click();
    fixture.detectChanges();
    expect(listerMembres).toHaveBeenLastCalledWith('org-1', 0, 8, 'ANCIENS');
    expect(anciens.getAttribute('aria-pressed')).toBe('true');
    expect(racine.querySelector('a.vignette')?.textContent).toContain('2018 – 2023');

    const toutVoir = racine.querySelector<HTMLButtonElement>('.tout-voir');
    expect(toutVoir?.textContent).toContain('Voir les 13 membres');
    toutVoir?.click();
    fixture.detectChanges();
    const dialogue = fixture.debugElement.query((element) => element.componentInstance instanceof DialogueMembresOrganisme);
    expect(dialogue.componentInstance.ouverte()).toBe(true);
    expect(dialogue.componentInstance.presenceInitiale()).toBe('ANCIENS');
  });

  it('ouvre sur les anciens quand personne n’y travaille plus, sans onglets inutiles', () => {
    listerMembres
      .mockReturnValueOnce(of(page([], 0, 2, 0)))
      .mockReturnValueOnce(of(page([membre('a', { actuel: false }), membre('b', { actuel: false })], 0, 2)));
    const { racine } = creer();

    expect(listerMembres).toHaveBeenLastCalledWith('org-1', 0, 8, 'ANCIENS');
    expect(racine.querySelector('.onglets')).toBeNull();
    expect(racine.querySelectorAll('a.vignette')).toHaveLength(2);
    expect(racine.querySelector('.tout-voir')).toBeNull();
  });

  it('affiche un état vide et propose de réessayer après une erreur', () => {
    listerMembres.mockReturnValueOnce(throwError(() => new Error('panne'))).mockReturnValueOnce(of(page([], 0, 0)));
    const { fixture, racine } = creer();
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('n’a pas pu être chargée');

    (racine.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('.vide')?.textContent).toContain('Aucun membre de la communauté');
  });
});
