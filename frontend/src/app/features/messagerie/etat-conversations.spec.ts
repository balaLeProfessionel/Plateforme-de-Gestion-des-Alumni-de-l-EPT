import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { CompteurMessages } from '../../core/services/messagerie/compteur-messages';
import { FluxMessagerie } from '../../core/services/messagerie/flux-messagerie';
import { Conversation, PageConversations } from '../../core/services/models/messagerie.model';
import { EtatConversations, TAILLE_PAGE_CONVERSATIONS } from './etat-conversations';

const conversation = (id: string): Conversation => ({
  id, type: 'GROUPE', nom: id, interlocuteur: null, urlPhoto: null, nombreParticipants: 2, monRole: 'MEMBRE',
  ecriture: 'OUVERTE', nombreNonLus: 0, dernierMessageLe: '2026-11-14T10:00:00Z', dernierMessage: null,
});
const page = (numero: number, ids: string[], totalPages: number, totalElements = 25): PageConversations => ({
  contenu: ids.map(conversation), page: numero, taille: TAILLE_PAGE_CONVERSATIONS, totalElements, totalPages,
});

describe('EtatConversations', () => {
  let http: HttpTestingController;
  let etat: EtatConversations;
  let evenements: Subject<unknown>;

  beforeEach(() => {
    evenements = new Subject<unknown>();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), EtatConversations,
        { provide: CompteurMessages, useValue: { actualiser: vi.fn() } },
        { provide: FluxMessagerie, useValue: { evenements, connecte: signal(true) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    etat = TestBed.inject(EtatConversations);
  });

  afterEach(() => http.verify());

  const demande = (numero: number, recherche?: string): TestRequest => http.expectOne((requete) =>
    requete.url === '/api/messagerie/conversations' && requete.params.get('page') === String(numero)
    && requete.params.get('recherche') === (recherche ?? null));

  it('charge la page suivante à la demande, puis relit toutes les pages affichées', () => {
    demande(0).flush(page(0, ['a', 'b'], 2));
    expect(etat.conversations().map((c) => c.id)).toEqual(['a', 'b']);
    expect(etat.aPlus()).toBe(true);

    etat.afficherPlus();
    demande(0).flush(page(0, ['a', 'b'], 2));
    demande(1).flush(page(1, ['c'], 2));
    expect(etat.conversations().map((c) => c.id)).toEqual(['a', 'b', 'c']);
    expect(etat.aPlus()).toBe(false);

    // « c » est remontée en tête entre les deux lectures : elle n’apparaît qu’une fois.
    etat.actualiser();
    demande(0).flush(page(0, ['c', 'a'], 2));
    demande(1).flush(page(1, ['c', 'b'], 2));
    expect(etat.conversations().map((c) => c.id)).toEqual(['c', 'a', 'b']);
  });

  it('repart de la première page pour une recherche', () => {
    demande(0).flush(page(0, ['a', 'b'], 2));
    etat.afficherPlus();
    demande(0).flush(page(0, ['a', 'b'], 2));
    demande(1).flush(page(1, ['c'], 2));

    etat.rechercher('promo');
    demande(0, 'promo').flush(page(0, ['b'], 1, 1));
    expect(etat.conversations().map((c) => c.id)).toEqual(['b']);
    expect(etat.total()).toBe(1);
    expect(etat.aPlus()).toBe(false);

    etat.rechercher(' promo ');
    http.expectNone((requete) => requete.url === '/api/messagerie/conversations');
  });

  it('retire tout de suite la pastille de la conversation lue, et d’elle seule', () => {
    const nonLue = (id: string, nombreNonLus: number): Conversation => ({ ...conversation(id), nombreNonLus });
    demande(0).flush({ ...page(0, [], 1, 2), contenu: [nonLue('a', 1), nonLue('b', 3)] });

    etat.marquerLue('a');
    expect(etat.conversations().map((c) => [c.id, c.nombreNonLus])).toEqual([['a', 0], ['b', 3]]);
  });

  it('relit la liste quand le flux signale une lecture faite ailleurs (autre onglet)', () => {
    vi.useFakeTimers();
    try {
      demande(0).flush({ ...page(0, [], 1, 1), contenu: [{ ...conversation('a'), nombreNonLus: 2 }] });
      evenements.next({ type: 'lu', conversationId: 'a' });
      vi.advanceTimersByTime(300);
      demande(0).flush(page(0, ['a'], 1, 1));
      expect(etat.conversations()[0].nombreNonLus).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
