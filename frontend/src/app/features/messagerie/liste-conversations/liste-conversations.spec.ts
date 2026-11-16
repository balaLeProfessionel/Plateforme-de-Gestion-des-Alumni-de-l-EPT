import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { Conversation } from '../../../core/services/models/messagerie.model';
import { EtatConversations } from '../etat-conversations';
import { ListeConversations } from './liste-conversations';

registerLocaleData(localeFr);

describe('ListeConversations', () => {
  const conversations = signal<Conversation[]>([]);
  const chargee = signal(true);
  const erreur = signal<string | null>(null);
  const recherche = signal('');
  const aPlus = signal(false);
  const total = signal(0);
  const etat = {
    conversations, chargee, erreur, recherche, aPlus, total, chargement: signal(false),
    actualiser: vi.fn(), afficherPlus: vi.fn(), rechercher: vi.fn((texte: string) => recherche.set(texte)),
  };

  beforeEach(() => {
    conversations.set([]);
    chargee.set(true);
    erreur.set(null);
    recherche.set('');
    aPlus.set(false);
    total.set(0);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ListeConversations],
      providers: [
        provideRouter([]),
        { provide: EtatConversations, useValue: etat },
        { provide: AuthService, useValue: { utilisateur: signal({ id: 'moi' }) } },
      ],
    });
  });

  function rendu(): HTMLElement {
    const fixture = TestBed.createComponent(ListeConversations);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche chaque conversation avec son aperçu et ses non-lus', () => {
    conversations.set([{
      id: 'c-1', type: 'GROUPE', nom: 'Promo 2018', interlocuteur: null, urlPhoto: null, nombreParticipants: 4, monRole: 'MEMBRE', ecriture: 'OUVERTE',
      nombreNonLus: 3, dernierMessageLe: '2026-11-14T10:00:00Z',
      dernierMessage: { auteurId: 'x', auteurNom: 'Awa Diop', contenu: 'On se voit samedi ?', supprime: false, envoyeLe: '2026-11-14T10:00:00Z' },
    }]);
    const racine = rendu();
    const lien = racine.querySelector('a[href="/messagerie/c-1"]') as HTMLAnchorElement;

    expect(lien.classList).toContain('non-lue');
    expect(lien.querySelector('.nom')?.textContent).toBe('Promo 2018');
    expect(lien.querySelector('.apercu')?.textContent).toBe('Awa Diop : On se voit samedi ?');
    expect(lien.querySelector('.pastille')?.textContent?.trim()).toBe('3');
    expect(lien.textContent).toContain('3 messages non lus');
  });

  it('invite à écrire quand il n’y a aucune conversation', () => {
    const fixture = TestBed.createComponent(ListeConversations);
    const nouvelle = vi.fn();
    fixture.componentInstance.nouvelle.subscribe(nouvelle);
    fixture.detectChanges();
    const bouton = (fixture.nativeElement as HTMLElement).querySelector('.etat.vide button') as HTMLButtonElement;

    bouton.click();
    expect(nouvelle).toHaveBeenCalled();
  });

  it('propose de réessayer après une erreur', () => {
    erreur.set('Impossible de charger vos conversations.');
    const racine = rendu();

    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger');
    (racine.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    expect(etat.actualiser).toHaveBeenCalled();
  });

  const conversation = (id: string, nom: string): Conversation => ({
    id, type: 'GROUPE', nom, interlocuteur: null, urlPhoto: null, nombreParticipants: 3, monRole: 'MEMBRE',
    ecriture: 'OUVERTE', nombreNonLus: 0, dernierMessageLe: '2026-11-14T10:00:00Z', dernierMessage: null,
  });

  it('cherche une conversation par son nom après une courte pause de frappe', async () => {
    vi.useFakeTimers();
    try {
      conversations.set([conversation('c-1', 'Promo 2018')]);
      const fixture = TestBed.createComponent(ListeConversations);
      fixture.detectChanges();
      const racine = fixture.nativeElement as HTMLElement;
      const champ = racine.querySelector<HTMLInputElement>('#recherche-conversations');
      expect(racine.querySelector('label[for="recherche-conversations"]')?.textContent).toBe('Rechercher une conversation');

      champ!.value = 'pro';
      champ!.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(etat.rechercher).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(300);
      expect(etat.rechercher).toHaveBeenCalledWith('pro');
    } finally {
      vi.useRealTimers();
    }
  });

  it('dit quand la recherche ne trouve rien et permet de l’effacer', () => {
    recherche.set('zzz');
    const racine = rendu();

    expect(racine.querySelector('.etat.vide')?.textContent).toContain('Aucune conversation ne correspond à « zzz »');
    expect(racine.querySelector('[role="status"]')?.textContent).toBe('Aucune conversation trouvée.');
    expect(racine.querySelector('#recherche-conversations')).not.toBeNull();
  });

  it('affiche les conversations suivantes à la demande', () => {
    conversations.set([conversation('c-1', 'Promo 2018')]);
    aPlus.set(true);
    const racine = rendu();

    const plus = [...racine.querySelectorAll('button')].find((b) => b.textContent?.includes('Afficher plus'));
    plus?.click();
    expect(etat.afficherPlus).toHaveBeenCalled();
  });
});
