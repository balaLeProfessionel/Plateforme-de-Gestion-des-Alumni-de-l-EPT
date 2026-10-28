import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { PageAnnuaire } from '../../core/services/models/annuaire.model';
import { Annuaire } from './annuaire';

describe('Annuaire', () => {
  let fixture: ComponentFixture<Annuaire>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let route: { queryParamMap: typeof parametres; snapshot: { queryParams: Record<string, string> } };

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({}));
    router = { navigate: vi.fn().mockResolvedValue(true) };
    route = { queryParamMap: parametres, snapshot: { queryParams: {} } };

    await TestBed.configureTestingModule({
      imports: [Annuaire],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('synchronise les filtres de l URL et affiche les résultats sans coordonnées privées', async () => {
    parametres.next(convertToParamMap({
      recherche: 'awa', role: 'ETUDIANT', filiere: 'GIT', promotion: '2025', ville: 'Thiès',
      tri: 'PROMOTION_DESC', page: '2'
    }));
    creerComposant();

    const requete = http.expectOne((req) => req.url === '/api/annuaire');
    expect(requete.request.params.get('recherche')).toBe('awa');
    expect(requete.request.params.get('role')).toBe('ETUDIANT');
    expect(requete.request.params.get('page')).toBe('2');
    requete.flush(page({
      contenu: [{
        id: '1', nom: 'Diop', prenom: 'Awa', role: 'ETUDIANT', statutCompte: 'ACTIF',
        urlPhoto: null, posteActuel: 'Élève ingénieure', villeResidence: 'Thiès', filiere: 'GIT',
        anneeSortie: 2025, organismeId: null, typeOrganisme: null,
        email: 'awa@example.com', telephone: '770000000', dateNaissance: '2000-01-01'
      } as never],
      page: 2,
      totalElements: 1,
      totalPages: 3
    }));
    await fixture.whenStable();

    const contenu = fixture.nativeElement.textContent;
    expect((fixture.nativeElement.querySelector('#recherche') as HTMLInputElement).value).toBe('awa');
    expect(contenu).toContain('Awa Diop');
    expect(contenu).not.toContain('awa@example.com');
    expect(contenu).not.toContain('770000000');
    expect(contenu).not.toContain('2000-01-01');
  });

  it('affiche successivement le chargement puis la liste vide', async () => {
    creerComposant();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.squelette')).toHaveLength(6);

    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Aucun membre trouvé');
  });

  it('affiche une erreur et relance la requête', async () => {
    creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(
      { message: 'Service indisponible' },
      { status: 503, statusText: 'Service Unavailable' }
    );
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Service indisponible');
    (fixture.nativeElement.querySelector('.etat-centre button') as HTMLButtonElement).click();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Aucun membre trouvé');
  });

  it('met les filtres dans l URL et les réinitialise', () => {
    const composant = creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    composant['modele'].set({
      recherche: ' Awa ', role: 'ETUDIANT', filiere: '', promotion: '2025', ville: ' Thiès ',
      tri: 'ALPHABETIQUE'
    });

    composant['appliquerFiltres']();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { recherche: 'Awa', role: 'ETUDIANT', promotion: '2025', ville: 'Thiès' },
      replaceUrl: true
    });

    composant['reinitialiser']();
    expect(router.navigate).toHaveBeenLastCalledWith([], { relativeTo: route, queryParams: {}, replaceUrl: true });
  });

  it('lance la recherche pendant la saisie sans bouton ni étape d’historique', async () => {
    parametres.next(convertToParamMap({ role: 'TOUS', page: '2' }));
    const composant = creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.rechercher')).toBeNull();

    composant['modele'].update((valeurs) => ({ ...valeurs, recherche: '  Awa ' }));
    fixture.detectChanges();
    await new Promise((fin) => setTimeout(fin, 400));

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: route,
      queryParams: { recherche: 'Awa', role: 'TOUS' },
      replaceUrl: true
    });
  });

  it('ne relance ni navigation ni requête au simple chargement de la page', async () => {
    parametres.next(convertToParamMap({ role: 'TOUS', ville: 'Dakar', page: '1' }));
    creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();
    await new Promise((fin) => setTimeout(fin, 400));

    expect(router.navigate).not.toHaveBeenCalled();
    http.expectNone((req) => req.url === '/api/annuaire');
  });

  it('applique un filtre du panneau dès qu’il change, sans bouton Appliquer', async () => {
    const composant = creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.bouton-filtres') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.appliquer')).toBeNull();

    composant['modele'].update((valeurs) => ({ ...valeurs, filiere: 'Génie Civil' }));
    fixture.detectChanges();
    await new Promise((fin) => setTimeout(fin, 400));

    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: route,
      queryParams: { role: 'ALUMNI', filiere: 'Génie Civil' },
      replaceUrl: true
    });
  });

  it('n’applique pas une promotion incomplète ou invalide', async () => {
    const composant = creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();

    composant['modele'].update((valeurs) => ({ ...valeurs, promotion: '20' }));
    fixture.detectChanges();
    await new Promise((fin) => setTimeout(fin, 400));
    expect(router.navigate).not.toHaveBeenCalled();
    expect(composant['promotionEnErreur']()).toBe(false);

    composant['modele'].update((valeurs) => ({ ...valeurs, promotion: '1850' }));
    fixture.detectChanges();
    await new Promise((fin) => setTimeout(fin, 400));
    expect(router.navigate).not.toHaveBeenCalled();
    expect(composant['promotionEnErreur']()).toBe(true);
  });

  it('ouvre les filtres avancés depuis la barre de recherche', async () => {
    creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();

    const bouton = fixture.nativeElement.querySelector('.bouton-filtres') as HTMLButtonElement;
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#panneau-filtres')).toBeNull();

    bouton.click();
    await fixture.whenStable();

    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#panneau-filtres #filiere')).not.toBeNull();
  });

  it('affiche les filtres appliqués en puces retirables', async () => {
    parametres.next(convertToParamMap({ role: 'ORGANISME', ville: 'Thiès', recherche: 'tech' }));
    route.snapshot.queryParams = { role: 'ORGANISME', ville: 'Thiès', recherche: 'tech', page: '2' };
    creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page());
    await fixture.whenStable();

    const puces = [...fixture.nativeElement.querySelectorAll('.puce-filtre')]
      .map((puce) => (puce as HTMLElement).textContent?.trim());
    expect(puces).toEqual(['« tech »', 'Type : Organismes', 'Ville : Thiès']);
    expect(fixture.nativeElement.querySelector('.compte-filtres')?.textContent?.trim()).toBe('2');

    (fixture.nativeElement.querySelectorAll('.puce-filtre')[2] as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenLastCalledWith([], {
      relativeTo: route,
      queryParams: { role: 'ORGANISME', recherche: 'tech' },
      replaceUrl: true
    });
  });

  it('affiche les alumni par défaut et permet d élargir à tous les membres', () => {
    const composant = creerComposant();
    const requeteInitiale = http.expectOne((req) => req.url === '/api/annuaire');
    expect(requeteInitiale.request.params.get('role')).toBe('ALUMNI');
    requeteInitiale.flush(page());

    composant['changerPortee']('TOUS');

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { role: 'TOUS' },
      replaceUrl: true
    });
  });

  it('navigue vers la page suivante avec un bouton accessible', async () => {
    route.snapshot.queryParams = { role: 'ALUMNI' };
    creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page({
      contenu: [{
        id: '1', nom: 'Sow', prenom: 'Ibrahima', role: 'ALUMNI', statutCompte: 'ACTIF',
        urlPhoto: null, posteActuel: null, villeResidence: null, filiere: null, anneeSortie: 2024,
        organismeId: null, typeOrganisme: null
      }],
      totalElements: 13,
      totalPages: 2
    }));
    await fixture.whenStable();

    const suivant = fixture.nativeElement.querySelector(
      'button[aria-label="Page suivante"]'
    ) as HTMLButtonElement;
    expect(suivant.disabled).toBe(false);
    suivant.click();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: route,
      queryParams: { role: 'ALUMNI', page: 1 }
    });
  });

  it('affiche une pagination numérotée compacte pour un grand nombre de pages', async () => {
    parametres.next(convertToParamMap({ page: '20' }));
    creerComposant();
    http.expectOne((req) => req.url === '/api/annuaire').flush(page({
      contenu: [{
        id: '1', nom: 'Sow', prenom: 'Ibrahima', role: 'ALUMNI', statutCompte: 'ACTIF',
        urlPhoto: null, posteActuel: null, villeResidence: null, filiere: null, anneeSortie: 2024,
        organismeId: null, typeOrganisme: null
      }],
      page: 20,
      totalElements: 500,
      totalPages: 42
    }));
    await fixture.whenStable();

    const pages = [...fixture.nativeElement.querySelectorAll('.pagination button:not([aria-label*="précédente"]):not([aria-label*="suivante"])')]
      .map((bouton) => (bouton as HTMLButtonElement).textContent?.trim());
    expect(pages).toEqual(['1', '20', '21', '22', '42']);
    expect(fixture.nativeElement.querySelector('.pagination [aria-current="page"]')?.textContent.trim()).toBe('21');
    expect(fixture.nativeElement.querySelectorAll('.pagination .ellipse')).toHaveLength(2);
  });

  function creerComposant(): Annuaire {
    fixture = TestBed.createComponent(Annuaire);
    return fixture.componentInstance;
  }

  function page(modifications: Partial<PageAnnuaire> = {}): PageAnnuaire {
    return {
      contenu: [],
      page: 0,
      taille: 12,
      totalElements: 0,
      totalPages: 0,
      ...modifications
    };
  }
});
