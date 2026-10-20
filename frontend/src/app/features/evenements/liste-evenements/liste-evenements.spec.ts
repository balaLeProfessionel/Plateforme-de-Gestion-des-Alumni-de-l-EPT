import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement, PageEvenements } from '../../../core/services/models/evenement';
import { ListeEvenements } from './liste-evenements';

describe('ListeEvenements', () => {
  let fixture: ComponentFixture<ListeEvenements>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let lister: ReturnType<typeof vi.fn>;
  let listerMesEvenements: ReturnType<typeof vi.fn>;
  let annuler: ReturnType<typeof vi.fn>;
  let router: Router;

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({}));
    lister = vi.fn().mockImplementation(() => of(page()));
    listerMesEvenements = vi.fn().mockImplementation(() => of(page()));
    annuler = vi.fn().mockImplementation(() => of(evenement({ statut: 'ANNULE' })));
    await TestBed.configureTestingModule({
      imports: [ListeEvenements],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: parametres } },
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

    expect(lister).toHaveBeenCalledWith('AVENIR', 0);
    expect(fixture.nativeElement.querySelectorAll('.carte-evenement')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.carte-evenement.officiel .badge-officiel')?.textContent)
      .toContain('EPT officiel');
    expect(fixture.nativeElement.querySelector('.carte-evenement:not(.officiel) .badge-communaute'))
      .not.toBeNull();
    expect(fixture.nativeElement.querySelector('.carte-evenement h2 a')?.getAttribute('href'))
      .toContain('/evenements/event-1');
  });

  it('garde une zone d’illustration commune pour les cartes avec ou sans image', async () => {
    lister.mockReturnValueOnce(of(page({ contenu: [
      evenement({ urlImage: null }),
      evenement({ id: 'event-2', urlImage: '/api/evenement-images/affiche.png' }),
    ], totalElements: 2, totalPages: 1 })));
    parametres.next(convertToParamMap({}));
    await fixture.whenStable();

    const visuels = [...fixture.nativeElement.querySelectorAll('.visuel-evenement')] as HTMLElement[];
    expect(visuels).toHaveLength(2);
    expect(visuels[0].classList).toContain('sans-image');
    expect(visuels[0].querySelector('span')?.textContent).toContain('EPT Alumni');
    expect(visuels[1].classList).not.toContain('sans-image');
    expect(visuels[1].querySelector('img')?.getAttribute('src')).toBe('/api/evenement-images/affiche.png');
  });

  it('synchronise la période et la page depuis l’URL', async () => {
    parametres.next(convertToParamMap({ periode: 'PASSES', page: '3' }));
    await fixture.whenStable();

    expect(lister).toHaveBeenLastCalledWith('PASSES', 3);
    expect(fixture.nativeElement.querySelector('.onglets-periode button[aria-pressed="true"]')?.textContent)
      .toContain('Passés');
  });

  it('charge ses événements depuis le filtre et conserve période et page dans l’URL', async () => {
    parametres.next(convertToParamMap({ vue: 'mes', periode: 'PASSES', page: '2' }));
    await fixture.whenStable();

    expect(listerMesEvenements).toHaveBeenLastCalledWith('PASSES', 2);
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

    expect(fixture.nativeElement.querySelector('[aria-current="page"]')?.textContent.trim()).toBe('1');
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
