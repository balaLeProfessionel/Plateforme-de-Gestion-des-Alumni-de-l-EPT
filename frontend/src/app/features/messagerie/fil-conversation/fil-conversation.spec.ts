import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurMessages } from '../../../core/services/messagerie/compteur-messages';
import { ConversationDetail, Message } from '../../../core/services/models/messagerie.model';
import { EtatConversations } from '../etat-conversations';
import { FilConversation } from './fil-conversation';

registerLocaleData(localeFr);

const MOI = 'u-moi';
const detailDirect: ConversationDetail = {
  id: 'c-1', type: 'DIRECTE', nom: 'Moussa Ndiaye', monRole: 'MEMBRE', creeLe: '2026-11-14T09:00:00Z',
  participants: [
    { id: MOI, prenom: 'Awa', nom: 'Diop', nomAffiche: 'Awa Diop', urlPhoto: null, role: 'ALUMNI', roleParticipant: 'MEMBRE' },
    { id: 'u-2', prenom: 'Moussa', nom: 'Ndiaye', nomAffiche: 'Moussa Ndiaye', urlPhoto: null, role: 'ETUDIANT', roleParticipant: 'MEMBRE' },
  ],
};
const message = (id: string, contenu: string, deMoi: boolean, envoyeLe = '2026-11-14T09:30:00Z'): Message => ({
  id, auteurId: deMoi ? MOI : 'u-2', auteurNom: deMoi ? 'Awa Diop' : 'Moussa Ndiaye', auteurPhoto: null,
  contenu, supprime: false, envoyeLe, deMoi,
});

describe('FilConversation', () => {
  let fixture: ComponentFixture<FilConversation>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const etat = { actualiser: vi.fn(), marquerLue: vi.fn() };
  const compteur = { actualiser: vi.fn() };

  beforeEach(async () => {
    parametres = new BehaviorSubject(convertToParamMap({ id: 'c-1' }));
    etat.actualiser.mockClear();
    etat.marquerLue.mockClear();
    compteur.actualiser.mockClear();
    await TestBed.configureTestingModule({
      imports: [FilConversation],
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ActivatedRoute, useValue: { paramMap: parametres } },
        { provide: EtatConversations, useValue: etat },
        { provide: CompteurMessages, useValue: compteur },
        { provide: AuthService, useValue: { utilisateur: signal({ id: MOI }) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FilConversation);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function charger(messages: Message[], plusAnciens = false): Promise<void> {
    http.expectOne('/api/messagerie/conversations/c-1').flush(detailDirect);
    http.expectOne((req) => req.url === '/api/messagerie/conversations/c-1/messages').flush({ messages, plusAnciens });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('affiche l’interlocuteur et ses messages, puis marque la conversation comme lue', async () => {
    await charger([message('m1', 'Bonjour Awa', false), message('m2', 'Bonjour Moussa', true, '2026-11-14T09:31:00Z')]);

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('h2')?.textContent).toContain('Moussa Ndiaye');
    expect(racine.querySelector('a[href="/profil/u-2"]')).not.toBeNull();
    const bulles = [...racine.querySelectorAll('app-message-fil')];
    expect(bulles.map((b) => b.querySelector('.bulle p')?.textContent?.trim())).toEqual(['Bonjour Awa', 'Bonjour Moussa']);
    expect(bulles[1].classList).toContain('de-moi');

    const lu = http.expectOne('/api/messagerie/conversations/c-1/lu');
    expect(lu.request.method).toBe('PATCH');
    lu.flush(null);
    expect(etat.marquerLue).toHaveBeenCalledWith('c-1');
    expect(compteur.actualiser).toHaveBeenCalled();
  });

  it('charge les messages plus anciens avant le premier affiché', async () => {
    await charger([message('m5', 'Récent', false, '2026-11-14T09:40:00Z')], true);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);

    const bouton = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')]
      .find((b) => b.textContent?.includes('Messages plus anciens')) as HTMLButtonElement;
    bouton.click();
    const requete = http.expectOne((req) => req.url === '/api/messagerie/conversations/c-1/messages');
    expect(requete.request.params.get('avant')).toBe('2026-11-14T09:40:00Z');
    requete.flush({ messages: [message('m4', 'Ancien', false, '2026-11-14T09:00:00Z')], plusAnciens: false });
    await fixture.whenStable();
    fixture.detectChanges();

    const textes = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.bulle p')].map((p) => p.textContent?.trim());
    expect(textes).toEqual(['Ancien', 'Récent']);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Messages plus anciens');
  });

  it('dit qu’une conversation est introuvable sans afficher la zone de saisie', async () => {
    http.expectOne('/api/messagerie/conversations/c-1').flush({ message: 'Cette conversation est introuvable.' },
      { status: 404, statusText: 'Not Found' });
    http.match((req) => req.url === '/api/messagerie/conversations/c-1/messages');
    await fixture.whenStable();
    fixture.detectChanges();

    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('[role="alert"]')?.textContent).toContain('introuvable');
    expect(racine.querySelector('app-zone-saisie')).toBeNull();
    expect(racine.querySelector('a[href="/messagerie"]')).not.toBeNull();
  });
});
