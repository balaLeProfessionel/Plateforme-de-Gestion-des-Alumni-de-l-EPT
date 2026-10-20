import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { AuthService } from '../../../core/services/auth/auth-service';
import { Evenement, PageParticipants } from '../../../core/services/models/evenement';
import { DetailEvenement } from './detail-evenement';

describe('DetailEvenement', () => {
  let fixture: ComponentFixture<DetailEvenement>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let obtenir: ReturnType<typeof vi.fn>;
  let listerParticipants: ReturnType<typeof vi.fn>;
  let repondre: ReturnType<typeof vi.fn>;
  let utilisateur: ReturnType<typeof signal>;
  let router: Router;

  beforeEach(async () => {
    vi.setSystemTime(new Date('2026-10-01T09:00:00Z'));
    parametres = new BehaviorSubject(convertToParamMap({ id: 'event-1' }));
    obtenir = vi.fn().mockReturnValue(of(evenement()));
    listerParticipants = vi.fn().mockReturnValue(of(pageParticipants()));
    repondre = vi.fn().mockImplementation((_id: string, reponse: string) =>
      of(evenement({ maReponse: reponse as Evenement['maReponse'], nombreParticipants: 9 })));
    utilisateur = signal({ id: 'organisateur-1', role: 'ALUMNI' });
    await TestBed.configureTestingModule({
      imports: [DetailEvenement],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: parametres,
            snapshot: { queryParamMap: convertToParamMap({ vue: 'mes', periode: 'PASSES', page: '2' }) }
          }
        },
        { provide: EvenementService, useValue: {
          lister: vi.fn(), obtenir, listerParticipants,
          repondre,
          annuler: vi.fn().mockReturnValue(of(evenement({ statut: 'ANNULE' }))),
          definirStatutOfficiel: vi.fn().mockReturnValue(of(evenement({ officielEpt: false })))
        } },
        { provide: AuthService, useValue: { utilisateur } },
        { provide: Location, useValue: { back: vi.fn() } }
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
    window.history.replaceState({}, '', '/');
    fixture = TestBed.createComponent(DetailEvenement);
    fixture.autoDetectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('affiche les informations de l’événement officiel et sa capacité', async () => {
    obtenir.mockReturnValueOnce(of(evenement({ nombrePlaces: 8, nombreParticipants: 8,
      maReponse: 'PARTICIPERA' })));
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    expect(obtenir).toHaveBeenLastCalledWith('event-1');
    expect(fixture.nativeElement.querySelector('.bandeau-officiel')?.textContent)
      .toContain('Événement officiel');
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Rencontre des diplômés');
    expect(fixture.nativeElement.textContent).toContain('École Polytechnique de Thiès');
    expect(fixture.nativeElement.textContent).toContain('Complet');
    expect(fixture.nativeElement.textContent).toContain('vous participez');
    expect(listerParticipants).toHaveBeenCalledWith('event-1', 0);
    expect(fixture.nativeElement.textContent).toContain('Participants inscrits');
    expect(fixture.nativeElement.querySelector('.actions-gestion')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.visuel-detail.sans-image')?.textContent).toContain('EPT Alumni');
    expect(fixture.nativeElement.querySelector('.actions-reponse')).not.toBeNull();
  });

  it('enregistre une participation puis permet de changer sa réponse', async () => {
    repondre
      .mockReturnValueOnce(of(evenement({ maReponse: 'PARTICIPERA', nombreParticipants: 9 })))
      .mockReturnValueOnce(of(evenement({ maReponse: 'NE_PARTICIPERA_PAS', nombreParticipants: 8 })));
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('.actions-reponse button') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(repondre).toHaveBeenNthCalledWith(1, 'event-1', 'PARTICIPERA');
    expect(fixture.nativeElement.textContent).toContain('Votre réponse enregistrée : vous participez.');
    expect(fixture.nativeElement.querySelector('.actions-reponse button[aria-pressed="true"]')?.textContent)
      .toContain('Je participe');

    (fixture.nativeElement.querySelectorAll('.actions-reponse button')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(repondre).toHaveBeenNthCalledWith(2, 'event-1', 'NE_PARTICIPERA_PAS');
    expect(fixture.nativeElement.textContent).toContain('vous ne participez pas');
  });

  it('désactive la réponse positive quand la capacité est atteinte', async () => {
    obtenir.mockReturnValueOnce(of(evenement({ nombrePlaces: 8, nombreParticipants: 8 })));
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    const boutons = fixture.nativeElement.querySelectorAll('.actions-reponse button') as NodeListOf<HTMLButtonElement>;
    expect(boutons[0].disabled).toBe(true);
    expect(boutons[1].disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('L’événement est complet.');
  });

  it('affiche une erreur de capacité renvoyée par le serveur', async () => {
    repondre.mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 409 })));
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    await fixture.componentInstance['enregistrerReponse']('PARTICIPERA');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.erreur-reponse[role="alert"]')?.textContent)
      .toContain('Cet événement est complet');
  });

  it('masque les choix pour une audience incompatible, un événement passé ou annulé', async () => {
    utilisateur.set({ id: 'autre-membre', role: 'ALUMNI' });
    obtenir.mockReturnValueOnce(of(evenement({ audience: 'ETUDIANTS' })));
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.actions-reponse')).toBeNull();

    obtenir.mockReturnValueOnce(of(evenement({ dateFin: '2020-10-15T12:00:00Z' })));
    parametres.next(convertToParamMap({ id: 'event-2' }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.actions-reponse')).toBeNull();

    obtenir.mockReturnValueOnce(of(evenement({ statut: 'ANNULE' })));
    parametres.next(convertToParamMap({ id: 'event-3' }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.actions-reponse')).toBeNull();
  });

  it('autorise chaque rôle lorsque son audience correspond, y compris le public TOUS', async () => {
    utilisateur.set({ id: 'etudiant-1', role: 'ETUDIANT' });
    obtenir.mockReturnValueOnce(of(evenement({ audience: 'ETUDIANTS' })));
    parametres.next(convertToParamMap({ id: 'event-etudiant' }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.actions-reponse')).not.toBeNull();

    utilisateur.set({ id: 'personnel-1', role: 'PERSONNEL' });
    obtenir.mockReturnValueOnce(of(evenement({ audience: 'TOUS' })));
    parametres.next(convertToParamMap({ id: 'event-tous' }));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.actions-reponse')).not.toBeNull();
  });

  it('affiche une image quand elle existe sans changer la structure de la fiche', async () => {
    obtenir.mockReturnValueOnce(of(evenement({ urlImage: '/api/evenement-images/affiche.png' })));
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    const visuel = fixture.nativeElement.querySelector('.visuel-detail') as HTMLElement;
    expect(visuel.classList).not.toContain('sans-image');
    expect(visuel.querySelector('img')?.getAttribute('src')).toBe('/api/evenement-images/affiche.png');
    expect(visuel.querySelector('img')?.getAttribute('alt')).toBe('Illustration de Rencontre des diplômés');
  });

  it('propose la page d’origine avec ses filtres comme secours du retour', () => {
    fixture.componentInstance['urlRetour'].set('/evenements?periode=PASSES&page=3');

    expect(fixture.componentInstance['urlSecours']()).toBe('/evenements?periode=PASSES&page=3');
  });

  it('revient au filtre personnel même après un accès direct au détail', () => {
    expect(fixture.componentInstance['urlSecours']()).toBe('/evenements?periode=PASSES&page=2&vue=mes');
  });

  it('gère l’absence de détail et propose une nouvelle tentative', async () => {
    obtenir.mockReset()
      .mockReturnValueOnce(throwError(() => ({ status: 404 })))
      .mockReturnValueOnce(of(evenement()));
    parametres.next(convertToParamMap({ id: 'missing' }));
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Cet événement n’est pas disponible.');
    (fixture.nativeElement.querySelector('.etat-detail button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(obtenir).toHaveBeenLastCalledWith('missing');
    expect(fixture.nativeElement.textContent).toContain('Rencontre des diplômés');
  });

  it('ne charge jamais les noms de participants pour un membre qui ne gère pas l’événement', async () => {
    listerParticipants.mockClear();
    utilisateur.set({ id: 'autre-membre', role: 'ALUMNI' });
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    expect(listerParticipants).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.liste-participants')).toBeNull();
    expect(fixture.nativeElement.querySelector('.gestion-evenement')).toBeNull();
  });

  it('permet à l’administrateur de gérer le caractère officiel', async () => {
    utilisateur.set({ id: 'admin-1', role: 'ADMIN' });
    parametres.next(convertToParamMap({ id: 'event-1' }));
    await fixture.whenStable();

    expect(listerParticipants).toHaveBeenCalledWith('event-1', 0);
    expect(fixture.nativeElement.textContent).toContain('Retirer le statut officiel');
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

  function pageParticipants(): PageParticipants {
    return { contenu: [], page: 0, taille: 12, totalElements: 0, totalPages: 0 };
  }
});
