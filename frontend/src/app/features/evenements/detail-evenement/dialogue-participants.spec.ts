import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { EvenementService } from '../../../core/services/evenements/evenement';
import { PageParticipants, ParticipantEvenement } from '../../../core/services/models/evenement';
import { DialogueParticipants } from './dialogue-participants';

describe('DialogueParticipants', () => {
  let fixture: ComponentFixture<DialogueParticipants>;
  let listerParticipants: ReturnType<typeof vi.fn>;

  const participant = (numero: number): ParticipantEvenement =>
    ({ id: `p${numero}`, prenom: `Prénom${numero}`, nom: 'Diop', role: 'ALUMNI', urlPhoto: null });
  const page = (numero: number, total: number, taille = 12): PageParticipants => ({
    contenu: Array.from({ length: Math.min(taille, total - numero * taille) }, (_, i) => participant(numero * taille + i)),
    page: numero, taille, totalElements: total, totalPages: Math.ceil(total / taille),
  });

  beforeEach(async () => {
    listerParticipants = vi.fn().mockImplementation((_id: string, numero: number, _taille: number, recherche: string) =>
      of(recherche ? { contenu: [participant(3)], page: 0, taille: 12, totalElements: 1, totalPages: 1 } : page(numero, 20)));
    await TestBed.configureTestingModule({
      imports: [DialogueParticipants],
      providers: [{ provide: EvenementService, useValue: { listerParticipants } }],
    }).compileComponents();
    fixture = TestBed.createComponent(DialogueParticipants);
    fixture.componentRef.setInput('evenementId', 'event-1');
    fixture.componentRef.setInput('ouverte', true);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  const lignes = () => fixture.nativeElement.querySelectorAll('li').length;

  it('complète la liste avec « Afficher plus » au lieu de changer de page', async () => {
    expect(lignes()).toBe(12);
    const plus = fixture.nativeElement.querySelector('.plus') as HTMLButtonElement;
    expect(plus.textContent).toContain('Afficher plus (8)');

    plus.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(listerParticipants).toHaveBeenLastCalledWith('event-1', 1, 12, '');
    expect(lignes()).toBe(20);
    expect(fixture.nativeElement.querySelector('.plus')).toBeNull();
  });

  it('propose la recherche à partir de 10 inscrits et l’applique après une pause', async () => {
    const champ = fixture.nativeElement.querySelector('#recherche-participants') as HTMLInputElement;
    expect(champ).not.toBeNull();
    vi.useFakeTimers();

    champ.value = 'prénom3';
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(listerParticipants).not.toHaveBeenCalledWith('event-1', 0, 12, 'prénom3');

    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(listerParticipants).toHaveBeenLastCalledWith('event-1', 0, 12, 'prénom3');
    expect(lignes()).toBe(1);
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('1 participant trouvé');
    // L’en-tête garde le nombre total d’inscrits.
    expect(fixture.nativeElement.querySelector('.total')?.textContent).toContain('20');
  });
});
