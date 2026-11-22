import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AnnuaireMembre, PageAnnuaire } from '../../../core/services/models/annuaire.model';
import { ConversationDetail } from '../../../core/services/models/messagerie.model';
import { AnnuaireCommunaute } from './annuaire-communaute';

const API = '/api/messagerie/communautes/p-2015/membres';
const promo: ConversationDetail = {
  id: 'p-2015', type: 'GROUPE', nom: 'Promo 2015', description: null, urlPhoto: null, monRole: 'MEMBRE',
  ecriture: 'OUVERTE', creeLe: '2026-11-14T09:00:00Z', categorie: 'PROMO', acces: 'OUVERTE', participants: [],
};
const membre = (id: string, prenom: string): AnnuaireMembre => ({
  id, prenom, nom: 'Diop', role: 'ALUMNI', statutCompte: 'ACTIF', urlPhoto: null, posteActuel: null,
  villeResidence: null, filiere: null, anneeSortie: 2015, organismeId: null, typeOrganisme: null,
});
const page = (contenu: AnnuaireMembre[], numero: number, totalElements: number, totalPages: number): PageAnnuaire =>
  ({ contenu, page: numero, taille: 24, totalElements, totalPages });

describe('AnnuaireCommunaute', () => {
  let fixture: ComponentFixture<AnnuaireCommunaute>;
  let http: HttpTestingController;

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await TestBed.configureTestingModule({
      imports: [AnnuaireCommunaute],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'p-2015' })) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AnnuaireCommunaute);
    fixture.detectChanges();
    http.expectOne('/api/messagerie/conversations/p-2015').flush(promo);
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const racine = () => fixture.nativeElement as HTMLElement;

  it('montre les membres de la communauté en cartes, puis ajoute la page suivante à la suite', async () => {
    http.expectOne((req) => req.url === API && req.params.get('page') === '0').flush(page([membre('u-1', 'Awa')], 0, 2, 2));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine().querySelector('#titre-annuaire')?.textContent).toBe('Membres de Promo 2015');
    expect(racine().querySelector('.resume')?.textContent).toBe('2 membres');
    expect(racine().querySelectorAll('app-carte-membre')).toHaveLength(1);

    (racine().querySelector('.plus') as HTMLButtonElement).click();
    http.expectOne((req) => req.url === API && req.params.get('page') === '1').flush(page([membre('u-2', 'Moussa')], 1, 2, 2));
    fixture.detectChanges();

    expect(racine().querySelectorAll('app-carte-membre')).toHaveLength(2);
    expect(racine().querySelector('.plus')).toBeNull();
  });

  it('cherche après une pause de frappe, et propose de tout revoir quand rien ne correspond', async () => {
    http.expectOne((req) => req.url === API).flush(page([membre('u-1', 'Awa')], 0, 1, 1));
    await fixture.whenStable();
    fixture.detectChanges();

    const champ = racine().querySelector('#recherche-membres') as HTMLInputElement;
    champ.value = 'ingénieur';
    champ.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(350);
    http.expectOne((req) => req.url === API && req.params.get('recherche') === 'ingénieur').flush(page([], 0, 0, 0));
    fixture.detectChanges();

    expect(racine().querySelector('.etat')?.textContent).toContain('Aucun membre ne correspond à « ingénieur »');
    (racine().querySelector('.etat button') as HTMLButtonElement).click();
    await vi.advanceTimersByTimeAsync(350);
    http.expectOne((req) => req.url === API && !req.params.has('recherche')).flush(page([membre('u-1', 'Awa')], 0, 1, 1));
    fixture.detectChanges();
    expect(racine().querySelector('.resume')?.textContent).toBe('1 membre');
  });

  it('renvoie à la discussion quand la communauté est introuvable', async () => {
    http.expectOne((req) => req.url === API).flush({ message: 'Cette conversation est introuvable.' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(racine().querySelector('.etat[role="alert"]')?.textContent).toContain('Cette conversation est introuvable.');
    expect(racine().querySelector('.etat a')?.getAttribute('href')).toBe('/messagerie/p-2015');
  });
});
