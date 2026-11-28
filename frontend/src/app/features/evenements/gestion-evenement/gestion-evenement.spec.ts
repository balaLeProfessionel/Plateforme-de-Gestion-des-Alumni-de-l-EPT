import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement } from '../../../core/services/models/evenement';
import { GestionEvenement } from './gestion-evenement';

describe('GestionEvenement', () => {
  let fixture: ComponentFixture<GestionEvenement>;
  let annuler: ReturnType<typeof vi.fn>;
  let element: HTMLElement;

  beforeEach(async () => {
    annuler = vi.fn().mockReturnValue(of(evenement({ statut: 'ANNULE' })));
    await TestBed.configureTestingModule({
      imports: [GestionEvenement],
      providers: [provideRouter([]), { provide: EvenementService, useValue: { annuler } }]
    }).compileComponents();
    fixture = TestBed.createComponent(GestionEvenement);
    fixture.componentRef.setInput('evenement', evenement());
    await fixture.whenStable();
    element = fixture.nativeElement as HTMLElement;
  });

  const bouton = (texte: string) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent?.includes(texte)) as HTMLButtonElement;

  it('demande une confirmation, annule puis transmet l événement annulé', async () => {
    const annule = vi.fn();
    fixture.componentInstance.annule.subscribe(annule);

    bouton('Annuler l’événement').click();
    await fixture.whenStable();
    expect(element.querySelector('.confirmation-detail')).not.toBeNull();

    bouton('Confirmer l’annulation').click();
    await fixture.whenStable();
    expect(annuler).toHaveBeenCalledWith('event-1');
    expect(annule).toHaveBeenCalledWith(expect.objectContaining({ statut: 'ANNULE' }));
    expect(element.querySelector('.confirmation-detail')).toBeNull();
  });

  it('garde la confirmation et affiche l erreur si l annulation échoue', async () => {
    annuler.mockReturnValue(throwError(() => new Error('refus')));
    bouton('Annuler l’événement').click();
    await fixture.whenStable();
    bouton('Confirmer l’annulation').click();
    await fixture.whenStable();
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('L’annulation a échoué');
    expect(element.querySelector('.confirmation-detail')).not.toBeNull();
  });

  it('ne propose pas l annulation d un événement déjà annulé', async () => {
    fixture.componentRef.setInput('evenement', evenement({ statut: 'ANNULE' }));
    await fixture.whenStable();
    expect(bouton('Annuler l’événement')).toBeUndefined();
    expect(element.querySelector('a.action-secondaire')?.getAttribute('href')).toBe('/evenements/event-1/modifier');
  });

  function evenement(modifications: Partial<Evenement> = {}): Evenement {
    return {
      id: 'event-1', titre: 'Rencontre des diplômés',
      description: 'Un temps fort organisé pour la communauté EPT.',
      lieu: 'École Polytechnique de Thiès', urlImage: null,
      dateDebut: '2026-10-15T09:00:00Z', dateFin: '2026-10-15T12:00:00Z',
      audience: 'TOUS', nombrePlaces: null, officielEpt: true, statut: 'PUBLIE',
      organisateurId: 'organisateur-1', organisateurNom: 'Diop', organisateurPrenom: 'Awa',
      nombreParticipants: 8, maReponse: null, participantsVisibles: true, ...modifications
    };
  }
});
