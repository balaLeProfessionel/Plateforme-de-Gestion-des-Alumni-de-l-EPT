import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { CompteurDemandesMentorat } from '../../../core/services/mentorat/compteur-demandes';
import { Mentorat, Page } from '../../../core/services/models/mentorat.model';
import { unMentorat } from '../testing/donnees-mentorat';
import { PageMentorats } from './page-mentorats';

describe('PageMentorats', () => {
  let fixture: ComponentFixture<PageMentorats>;
  let http: HttpTestingController;
  let racine: HTMLElement;

  const donnees = {
    sections: [
      { titre: 'À traiter', role: 'MENTOR', statuts: ['EN_ATTENTE'] },
      { titre: 'En cours', role: 'MENTOR', statuts: ['ACCEPTEE'] },
      { titre: 'Historique', role: 'MENTOR', statuts: ['TERMINEE', 'REFUSEE', 'ANNULEE'] },
    ],
    titreVide: 'Personne à accompagner',
    texteVide: 'Les demandes arriveront ici.',
    invitation: { libelle: 'Voir mon offre', lien: '/mentorat/offre' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PageMentorats],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: donnees } } },
        { provide: CompteurDemandesMentorat, useValue: { actualiser: vi.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PageMentorats);
    racine = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  /** Répond aux trois sections, dans l’ordre de leurs statuts. */
  function repondre(contenus: Mentorat[][]): void {
    const requetes = http.match((req) => req.url === '/api/mentorat/mentorats');
    expect(requetes.map((r) => r.request.params.getAll('statut')?.[0])).toEqual(['EN_ATTENTE', 'ACCEPTEE', 'TERMINEE']);
    requetes.forEach((requete, i) => requete.flush(page(contenus[i])));
    fixture.detectChanges();
  }

  const titresVisibles = () => [...racine.querySelectorAll('section:not([hidden]) h2')]
    .map((titre) => titre.textContent?.replace(/\s+/g, ' ').trim());

  it('met d’abord ce qui attend une action et masque les sections vides', async () => {
    repondre([[unMentorat({ id: 'a' })], [], [unMentorat({ id: 'b', statut: 'TERMINEE' }), unMentorat({ id: 'c', statut: 'REFUSEE' })]]);
    await fixture.whenStable();

    expect(titresVisibles()).toEqual(['À traiter 1', 'Historique 2']);
    expect(racine.querySelector('.etat')).toBeNull();
  });

  it('invite à agir quand toutes les sections sont vides', async () => {
    repondre([[], [], []]);
    await fixture.whenStable();

    expect(titresVisibles()).toEqual([]);
    const etat = racine.querySelector('.etat') as HTMLElement;
    expect(etat.textContent).toContain('Personne à accompagner');
    expect(etat.querySelector('a')?.getAttribute('href')).toBe('/mentorat/offre');
  });

  it('recharge toutes les sections quand un mentorat change de section', async () => {
    repondre([[unMentorat({ id: 'a' })], [], []]);
    await fixture.whenStable();

    (racine.querySelector('.actions .principal') as HTMLButtonElement).click();
    http.expectOne('/api/mentorat/mentorats/a/accepter').flush(unMentorat({ id: 'a', statut: 'ACCEPTEE' }));
    fixture.detectChanges();
    repondre([[], [unMentorat({ id: 'a', statut: 'ACCEPTEE' })], []]);
    await fixture.whenStable();

    expect(titresVisibles()).toEqual(['En cours 1']);
  });
});

function page(contenu: Mentorat[]): Page<Mentorat> {
  return { contenu, page: 0, taille: 12, totalElements: contenu.length, totalPages: contenu.length ? 1 : 0 };
}
