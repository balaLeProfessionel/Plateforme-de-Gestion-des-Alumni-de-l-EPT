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
  const etat = { conversations, chargee, erreur, chargement: signal(false), actualiser: vi.fn() };

  beforeEach(() => {
    conversations.set([]);
    chargee.set(true);
    erreur.set(null);
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
});
