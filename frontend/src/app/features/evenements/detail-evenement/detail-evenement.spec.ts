import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement } from '../../../core/services/models/evenement';
import { DetailEvenement } from './detail-evenement';

describe('DetailEvenement', () => {
  let fixture: ComponentFixture<DetailEvenement>;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let obtenir: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({ id: 'event-1' }));
    obtenir = vi.fn().mockReturnValue(of(evenement()));
    await TestBed.configureTestingModule({
      imports: [DetailEvenement],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: parametres,
            snapshot: { queryParamMap: convertToParamMap({ periode: 'PASSES', page: '2' }) }
          }
        },
        { provide: EvenementService, useValue: { lister: vi.fn(), obtenir } },
        { provide: Location, useValue: { back: vi.fn() } }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DetailEvenement);
    fixture.autoDetectChanges();
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

  function evenement(modifications: Partial<Evenement> = {}): Evenement {
    return {
      id: 'event-1', titre: 'Rencontre des diplômés',
      description: 'Un temps fort organisé pour la communauté EPT.',
      lieu: 'École Polytechnique de Thiès',
      dateDebut: '2026-10-15T09:00:00Z', dateFin: '2026-10-15T12:00:00Z',
      audience: 'TOUS', nombrePlaces: null, officielEpt: true, statut: 'PUBLIE',
      organisateurId: 'organisateur-1', organisateurNom: 'Diop', organisateurPrenom: 'Awa',
      nombreParticipants: 8, maReponse: null, ...modifications
    };
  }
});
