import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { EvenementService } from '../../../core/services/evenements/evenement';
import { AUCUN_FILTRE, Evenement, PageEvenements } from '../../../core/services/models/evenement';
import { ListeEvenements } from './liste-evenements';

describe('ListeEvenements', () => {
  let fixture: ComponentFixture<ListeEvenements>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let lister: ReturnType<typeof vi.fn>;
  let listerMesEvenements: ReturnType<typeof vi.fn>;
  let annuler: ReturnType<typeof vi.fn>;
  let router: Router;
  const utilisateur = signal<{ id: string } | null>({ id: 'moi' });

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({}));
    utilisateur.set({ id: 'moi' });
    lister = vi.fn().mockImplementation(() => of(page()));
    listerMesEvenements = vi.fn().mockImplementation(() => of(page()));
    annuler = vi.fn().mockImplementation(() => of(evenement({ statut: 'ANNULE' })));
    await TestBed.configureTestingModule({
      imports: [ListeEvenements],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres } },
        { provide: AuthService, useValue: { utilisateur } },
        { provide: EvenementService, useValue: { lister, listerMesEvenements, annuler, obtenir: vi.fn() } }
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ListeEvenements);
    fixture.autoDetectChanges();
  });

  it('charge les événements à venir par défaut et met les événements EPT en avant', async () => {
    lister.mockReturnValueOnce(of(page({ contenu: [evenement(), evenement({
      id: 'event-2', titre: 'Rencontre Alumni', officielEpt: false,
      audience: 'ALUMNI', nombreParticipants: 1
    })], totalElements: 2, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    expect(lister).toHaveBeenCalledWith('AVENIR', 0, AUCUN_FILTRE);
    expect(fixture.nativeElement.querySelectorAll('.carte-evenement')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.carte-evenement.officiel .badge-officiel')?.textContent)
      .toContain('EPT officiel');
    expect(fixture.nativeElement.querySelector('.carte-evenement:not(.officiel) .badge-communaute'))
      .not.toBeNull();
    expect(fixture.nativeElement.querySelector('.carte-evenement h2 a')?.getAttribute('href'))
      .toContain('/evenements/event-1');
  });

  it('affiche l’image ou, à défaut, une affiche datée dans le même cadre 16:9', async () => {
    lister.mockReturnValueOnce(of(page({ contenu: [
      evenement({ urlImage: null }),
      evenement({ id: 'event-2', urlImage: '/api/evenement-images/affiche.png' }),
    ], totalElements: 2, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    const visuels = [...fixture.nativeElement.querySelectorAll('.visuel-evenement')] as HTMLElement[];
    expect(visuels).toHaveLength(2);
    expect(visuels[0].querySelector('img')).toBeNull();
    expect(visuels[0].querySelector('.affiche .date')).not.toBeNull();
    expect(visuels[0].querySelector('.affiche')?.getAttribute('aria-hidden')).toBe('true');
    expect(visuels[1].querySelector('.affiche')).toBeNull();
    expect(visuels[1].querySelector('img')?.getAttribute('src')).toBe('/api/evenement-images/affiche.png');
    // Les trois premières affiches sont visibles d'emblée : chargées tout de suite, les suivantes en différé.
    expect(visuels[1].querySelector('img')?.hasAttribute('loading')).toBe(false);
  });

  it('diffère le chargement des affiches au-delà des trois premières', async () => {
    lister.mockReturnValueOnce(of(page({ contenu: [1, 2, 3, 4].map((n) =>
      evenement({ id: `event-${n}`, urlImage: `/api/evenement-images/${n}.png` })), totalElements: 4, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    const images = [...fixture.nativeElement.querySelectorAll('.visuel-evenement img')] as HTMLImageElement[];
    expect(images.map((image) => image.getAttribute('loading'))).toEqual([null, null, null, 'lazy']);
  });

  it('rend toute la carte cliquable avec un seul lien, nommé par le titre', async () => {
    lister.mockReturnValueOnce(of(page({ contenu: [evenement({})], totalElements: 1, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    const carte = fixture.nativeElement.querySelector('.carte-evenement') as HTMLElement;
    const liens = [...carte.querySelectorAll('a')];
    expect(carte.classList).toContain('carte-cliquable');
    expect(liens).toHaveLength(1);
    expect(liens[0].classList).toContain('lien-etire');
    expect(liens[0].closest('h2')).not.toBeNull();
  });

  it('lit les critères de recherche dans l’URL et ignore les valeurs invalides', async () => {
    parametres.next(convertToParamMap({ recherche: 'forum', lieu: 'Thiès', officiel: 'peut-etre' }));
    await fixture.whenStable();

    expect(lister).toHaveBeenLastCalledWith('AVENIR', 0, { recherche: 'forum', lieu: 'Thiès', officiel: '' });
    expect(fixture.nativeElement.querySelector('.resume-evenements')?.textContent).toContain('selon vos critères');
  });

  it('applique les filtres dans l’URL en revenant à la première page sans empiler l’historique', () => {
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance['appliquerFiltres']({ ...AUCUN_FILTRE, lieu: 'Dakar', officiel: 'non' });
    expect(navigation).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { recherche: null, lieu: 'Dakar', officiel: 'non', page: 0 },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('propose d’effacer les filtres quand aucun événement ne correspond', async () => {
    parametres.next(convertToParamMap({ recherche: 'introuvable' }));
    await fixture.whenStable();
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const etat = fixture.nativeElement.querySelector('.etat-evenements') as HTMLElement;
    expect(etat.textContent).toContain('Aucun événement ne correspond');
    (etat.querySelector('button') as HTMLButtonElement).click();
    expect(navigation).toHaveBeenCalledOnce();
    expect(navigation).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { recherche: null, lieu: null, officiel: null, periode: null, page: 0 },
    }));
  });

  it('signale mes propres événements dans la liste de tous et permet de les modifier', async () => {
    utilisateur.set({ id: 'organisateur-1' });
    lister.mockReturnValueOnce(of(page({ contenu: [evenement(), evenement({ id: 'event-2', organisateurId: 'autre' })],
      totalElements: 2, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    const [mien, autre] = [...fixture.nativeElement.querySelectorAll('.carte-evenement')] as HTMLElement[];
    expect(mien.querySelector('.badge-organisateur')?.textContent).toContain('Vous organisez');
    expect(mien.querySelector('.actions-carte a')?.getAttribute('href')).toContain('/evenements/event-1/modifier');
    expect(autre.querySelector('.badge-organisateur')).toBeNull();
    expect(autre.querySelector('.actions-carte')).toBeNull();
  });

  it('affiche un événement ponctuel par sa seule date de début', async () => {
    lister.mockReturnValueOnce(of(page({ contenu: [evenement({ dateDebut: '2026-10-22T15:34:00Z', dateFin: null })],
      totalElements: 1, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.date-evenement')?.textContent?.trim()).toBe('22 octobre 2026 · 15:34');
  });

  it('synchronise la période et la page depuis l’URL', async () => {
    parametres.next(convertToParamMap({ periode: 'PASSES', page: '3' }));
    await fixture.whenStable();

    expect(lister).toHaveBeenLastCalledWith('PASSES', 3, AUCUN_FILTRE);
    expect(fixture.nativeElement.querySelector('.resume-evenements')?.textContent).toContain('passé');
  });

  it('charge ses événements depuis le filtre et conserve période et page dans l’URL', async () => {
    parametres.next(convertToParamMap({ vue: 'mes', periode: 'PASSES', page: '2' }));
    await fixture.whenStable();

    expect(listerMesEvenements).toHaveBeenLastCalledWith('PASSES', 2, AUCUN_FILTRE);
    expect(fixture.nativeElement.querySelector('button[aria-pressed="true"]')?.textContent)
      .toContain('Mes événements');
  });

  it('change le filtre vers ses événements sans perdre la période et remet la page à zéro', () => {
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    parametres.next(convertToParamMap({ periode: 'PASSES', page: '3' }));

    fixture.componentInstance['changerVue'](true);

    expect(navigation).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { vue: 'mes', page: 0 },
      queryParamsHandling: 'merge'
    });
  });

  it('affiche les actions de gestion uniquement dans le filtre personnel et annule après confirmation', async () => {
    listerMesEvenements.mockReturnValue(of(page({
      contenu: [evenement()], totalElements: 1, totalPages: 1
    })));
    parametres.next(convertToParamMap({ vue: 'mes' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.actions-carte')).not.toBeNull();
    (fixture.nativeElement.querySelector('.actions-carte .action-danger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('les réponses seront conservées');
    (fixture.nativeElement.querySelector('.confirmation-annulation .action-danger') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(annuler).toHaveBeenCalledWith('event-1');
    expect(listerMesEvenements).toHaveBeenCalledTimes(2);
  });

  it('affiche un état vide avec une action de création dans le filtre personnel', async () => {
    parametres.next(convertToParamMap({ vue: 'mes' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Les événements que vous organiserez apparaîtront ici.');
    expect(fixture.nativeElement.querySelector('.etat-evenements a')?.getAttribute('href'))
      .toContain('/evenements/creer');
  });

  it('conserve les critères de retour vers le détail et remet la page à zéro au changement de période', async () => {
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    lister.mockReturnValue(of(page({ contenu: [evenement()] })));
    parametres.next(convertToParamMap({ periode: 'AVENIR', page: '2' }));
    await fixture.whenStable();
    const carte = fixture.nativeElement.querySelector('.carte-evenement h2 a') as HTMLAnchorElement;
    expect(carte.getAttribute('href')).toContain('periode=AVENIR');
    fixture.componentInstance['changerPeriode']('PASSES');

    expect(navigation).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { periode: 'PASSES', page: 0 },
      queryParamsHandling: 'merge'
    });
  });

  it('affiche les événements passés vides avec un message adapté', async () => {
    parametres.next(convertToParamMap({ periode: 'PASSES' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Aucun événement passé');
    expect(fixture.nativeElement.textContent).toContain('Les événements terminés apparaîtront ici.');
  });

  it('affiche une erreur puis permet de relancer le chargement', async () => {
    lister.mockReset()
      .mockReturnValueOnce(throwError(() => ({
        status: 503, error: { message: 'Service indisponible' }
      })))
      .mockReturnValueOnce(of(page()));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Service indisponible');
    (fixture.nativeElement.querySelector('.etat-evenements button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(lister).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Aucun événement à venir');
  });

  it('affiche une pagination accessible et ignore une page hors limites', async () => {
    const navigation = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    lister.mockReturnValueOnce(of(page({
      contenu: [evenement()], page: 0, totalElements: 25, totalPages: 3
    })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.pagination-evenements [aria-current="page"]')?.textContent.trim()).toBe('1');
    expect((fixture.nativeElement.querySelector('[aria-label="Page précédente"]') as HTMLButtonElement).disabled)
      .toBe(true);
    fixture.componentInstance['changerPage'](3);
    expect(navigation).not.toHaveBeenCalled();
    fixture.componentInstance['changerPage'](1);
    expect(navigation).toHaveBeenCalled();
  });

  function evenement(modifications: Partial<Evenement> = {}): Evenement {
    return {
      id: 'event-1', titre: 'Rencontre des diplômés',
      description: 'Un temps fort organisé pour la communauté EPT.',
      lieu: 'École Polytechnique de Thiès', urlImage: null,
      dateDebut: '2026-10-15T09:00:00Z', dateFin: '2026-10-15T12:00:00Z',
      audience: 'TOUS', nombrePlaces: null, officielEpt: true, statut: 'PUBLIE',
      organisateurId: 'organisateur-1', organisateurNom: 'Diop', organisateurPrenom: 'Awa',
      nombreParticipants: 8, maReponse: null, ...modifications
    };
  }

  function page(modifications: Partial<PageEvenements> = {}): PageEvenements {
    return { contenu: [], page: 0, taille: 12, totalElements: 0, totalPages: 0, ...modifications };
  }
});
