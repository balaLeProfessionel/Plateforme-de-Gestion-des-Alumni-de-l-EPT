import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MessagerieService } from './messagerie';

describe('MessagerieService', () => {
  let service: MessagerieService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MessagerieService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les conversations par page', () => {
    service.listerConversations().subscribe();
    const requete = http.expectOne((req) => req.url === '/api/messagerie/conversations');
    expect(requete.request.params.get('page')).toBe('0');
    expect(requete.request.params.get('taille')).toBe('30');
    requete.flush({ contenu: [], page: 0, taille: 30, totalElements: 0, totalPages: 0 });
  });

  it('ouvre une conversation directe et crée un groupe avec le bon corps', () => {
    service.ouvrirDirecte('u-1').subscribe();
    const directe = http.expectOne('/api/messagerie/conversations/directes');
    expect(directe.request.method).toBe('POST');
    expect(directe.request.body).toEqual({ destinataireId: 'u-1' });
    directe.flush({});

    service.creerGroupe('Promo 2018', ['u-1', 'u-2']).subscribe();
    const groupe = http.expectOne('/api/messagerie/conversations/groupes');
    expect(groupe.request.body).toEqual({ nom: 'Promo 2018', membreIds: ['u-1', 'u-2'] });
    groupe.flush({});
  });

  it('charge l’historique avant une date et encode les identifiants', () => {
    service.listerMessages('a/b', '2026-11-14T10:00:00Z').subscribe();
    const requete = http.expectOne((req) => req.url === '/api/messagerie/conversations/a%2Fb/messages');
    expect(requete.request.params.get('avant')).toBe('2026-11-14T10:00:00Z');
    expect(requete.request.params.get('taille')).toBe('30');
    requete.flush({ messages: [], plusAnciens: false });

    service.listerMessages('c-1').subscribe();
    const derniers = http.expectOne((req) => req.url === '/api/messagerie/conversations/c-1/messages');
    expect(derniers.request.params.has('avant')).toBe(false);
    derniers.flush({ messages: [], plusAnciens: false });
  });

  it('envoie, supprime, marque lu et quitte avec les bonnes méthodes', () => {
    service.envoyer('c-1', 'Bonjour').subscribe();
    const envoi = http.expectOne('/api/messagerie/conversations/c-1/messages');
    expect(envoi.request.method).toBe('POST');
    expect(envoi.request.body).toEqual({ contenu: 'Bonjour' });
    envoi.flush({});

    service.supprimerMessage('c-1', 'm-1').subscribe();
    expect(http.expectOne('/api/messagerie/conversations/c-1/messages/m-1').request.method).toBe('DELETE');

    service.marquerLu('c-1').subscribe();
    expect(http.expectOne('/api/messagerie/conversations/c-1/lu').request.method).toBe('PATCH');

    service.retirerParticipant('c-1', 'u-9').subscribe();
    expect(http.expectOne('/api/messagerie/conversations/c-1/participants/u-9').request.method).toBe('DELETE');
  });
});
