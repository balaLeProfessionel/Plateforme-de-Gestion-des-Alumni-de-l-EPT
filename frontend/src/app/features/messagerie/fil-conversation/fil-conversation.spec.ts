import { registerLocaleData } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import localeFr from '@angular/common/locales/fr';
import { LOCALE_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { vi } from 'vitest';

import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurMessages } from '../../../core/services/messagerie/compteur-messages';
import { EvenementMessagerie, FluxMessagerie } from '../../../core/services/messagerie/flux-messagerie';
import { ConversationDetail, Message } from '../../../core/services/models/messagerie.model';
import { NotificationService } from '../../../core/services/notifications/notifications';
import { EtatCommunautes } from '../etat-communautes';
import { EtatConversations } from '../etat-conversations';
import { FilConversation } from './fil-conversation';

registerLocaleData(localeFr);

const MOI = 'u-moi';
const detailDirect: ConversationDetail = {
  id: 'c-1', type: 'DIRECTE', nom: 'Moussa Ndiaye', description: null, urlPhoto: null, monRole: 'MEMBRE',
  ecriture: 'OUVERTE', creeLe: '2026-11-14T09:00:00Z', categorie: null, acces: null,
  participants: [
    { id: MOI, prenom: 'Awa', nom: 'Diop', nomAffiche: 'Awa Diop', urlPhoto: null, role: 'ALUMNI', roleParticipant: 'MEMBRE' },
    { id: 'u-2', prenom: 'Moussa', nom: 'Ndiaye', nomAffiche: 'Moussa Ndiaye', urlPhoto: null, role: 'ETUDIANT', roleParticipant: 'MEMBRE' },
  ],
};
const message = (id: string, contenu: string, deMoi: boolean, envoyeLe = '2026-11-14T09:30:00Z'): Message => ({
  id, auteurId: deMoi ? MOI : 'u-2', auteurNom: deMoi ? 'Awa Diop' : 'Moussa Ndiaye', auteurPhoto: null,
  contenu, supprime: false, envoyeLe, deMoi, pieceJointe: null, systeme: false,
});

describe('FilConversation', () => {
  let fixture: ComponentFixture<FilConversation>;
  let http: HttpTestingController;
  let parametres: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const etat = { actualiser: vi.fn(), marquerLue: vi.fn() };
  const compteur = { actualiser: vi.fn() };
  let signaux: Subject<EvenementMessagerie>;
  const connecte = signal(true);
  const communautes = { marquerLue: vi.fn(), actualiser: vi.fn() };
  const cloche = { actualiser: vi.fn() };

  beforeEach(async () => {
    connecte.set(true);
    parametres = new BehaviorSubject(convertToParamMap({ id: 'c-1' }));
    signaux = new Subject();
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
        { provide: EtatCommunautes, useValue: communautes },
        { provide: NotificationService, useValue: cloche },
        { provide: CompteurMessages, useValue: compteur },
        { provide: FluxMessagerie, useValue: { evenements: signaux, connecte } },
        { provide: AuthService, useValue: { utilisateur: signal({ id: MOI }) } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FilConversation);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('affiche l’arrivée dans une communauté comme une pastille centrée, et le nombre de membres', async () => {
    const promo: ConversationDetail = { ...detailDirect, type: 'GROUPE', nom: 'Promo 2015', categorie: 'PROMO', acces: 'OUVERTE' };
    await charger([
      message('m-1', 'Bienvenue', false),
      { ...message('m-2', 'a rejoint la communauté.', false, '2026-11-14T09:31:00Z'), systeme: true },
    ], false, promo);
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.titre p')?.textContent).toBe('Communauté de promo · 2 membres');
    expect(racine.querySelector('.entete-fil app-avatar-groupe .pi-graduation-cap')).not.toBeNull();
    // Un membre a écrit : plus d’accueil, le fil suffit.
    expect(racine.querySelector('app-accueil-communaute')).toBeNull();
    (racine.querySelector('.bouton-plus') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(racine.querySelector('#menu-fil a[href="/messagerie/c-1/membres"]')?.textContent).toContain('Annuaire des membres');
    expect(racine.querySelectorAll('app-message-fil')).toHaveLength(1);
    expect(racine.querySelector('app-message-systeme')?.textContent).toContain('Moussa Ndiaye a rejoint la communauté.');
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    expect(communautes.marquerLue).toHaveBeenCalledWith('c-1');
    expect(cloche.actualiser).toHaveBeenCalled();
  });

  async function charger(messages: Message[], plusAnciens = false, detail = detailDirect): Promise<void> {
    http.expectOne('/api/messagerie/conversations/c-1').flush(detail);
    http.expectOne((req) => req.url === '/api/messagerie/conversations/c-1/messages').flush({ messages, plusAnciens });
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('présente une communauté où personne n’a écrit : pourquoi j’en fais partie, au-dessus des arrivées', async () => {
    const promo: ConversationDetail = {
      ...detailDirect, type: 'GROUPE', nom: 'Promo 2015', categorie: 'PROMO', acces: 'OUVERTE', description: 'Les X2015.',
    };
    await charger([{ ...message('m-1', 'a rejoint la communauté.', false), systeme: true }], false, promo);
    http.match('/api/messagerie/conversations/c-1/lu').forEach((requete) => requete.flush(null));
    const accueil = (fixture.nativeElement as HTMLElement).querySelector('app-accueil-communaute') as HTMLElement;

    expect(accueil.querySelector('h3')?.textContent).toBe('Bienvenue dans Promo 2015');
    expect(accueil.querySelector('.nature')?.textContent).toBe('Communauté de promo');
    expect(accueil.querySelector('.description')?.textContent).toBe('Les X2015.');
    expect(accueil.querySelector('.entree')?.textContent).toContain('par votre promo, renseignée dans votre profil');
    expect(accueil.textContent).toContain('2 membres');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-message-systeme')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.etat.vide')).toBeNull();
  });

  it('garde l’état vide habituel pour un groupe privé sans message', async () => {
    await charger([], false, { ...detailDirect, type: 'GROUPE', nom: 'Projet' });
    http.match('/api/messagerie/conversations/c-1/lu').forEach((requete) => requete.flush(null));
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('app-accueil-communaute')).toBeNull();
    expect(racine.querySelector('.etat.vide')?.textContent).toContain('Aucun message pour l’instant');
  });

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
    // Flux ouvert : le badge est recompté par le signal « lu », pas une seconde fois ici.
    expect(compteur.actualiser).not.toHaveBeenCalled();
  });

  it('bloque l’interlocuteur après confirmation, puis remplace la saisie par le bouton « Débloquer »', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    const racine = fixture.nativeElement as HTMLElement;
    const boutons = () => [...racine.querySelectorAll('button')];

    racine.querySelector<HTMLButtonElement>('.bouton-plus')?.click();
    fixture.detectChanges();
    boutons().find((b) => b.textContent?.trim() === 'Bloquer Moussa Ndiaye')?.click();
    fixture.detectChanges();
    expect(racine.querySelector('#menu-fil')).toBeNull();
    expect(racine.querySelector('app-zone-saisie')).toBeNull();
    expect(racine.querySelector('app-bandeau-blocage')?.textContent).toContain('Bloquer Moussa Ndiaye ?');

    racine.querySelector<HTMLButtonElement>('app-bandeau-blocage .danger')?.click();
    const blocage = http.expectOne('/api/messagerie/blocages/u-2');
    expect(blocage.request.method).toBe('PUT');
    blocage.flush(null);
    await fixture.whenStable();
    http.expectOne('/api/messagerie/conversations/c-1').flush({ ...detailDirect, ecriture: 'J_AI_BLOQUE' });
    fixture.detectChanges();

    expect(etat.actualiser).toHaveBeenCalled();
    expect(racine.querySelector('app-bandeau-blocage')?.textContent).toContain('Vous avez bloqué Moussa Ndiaye');
    expect(boutons().some((b) => b.textContent?.trim() === 'Bloquer')).toBe(false);

    boutons().find((b) => b.textContent?.trim() === 'Débloquer')?.click();
    const deblocage = http.expectOne('/api/messagerie/blocages/u-2');
    expect(deblocage.request.method).toBe('DELETE');
    deblocage.flush(null);
    await fixture.whenStable();
    http.expectOne('/api/messagerie/conversations/c-1').flush(detailDirect);
    fixture.detectChanges();
    expect(racine.querySelector('app-zone-saisie')).not.toBeNull();
  });

  it('donne le rôle sous le nom, et un menu « ⋯ » qui se ferme avec Échap en rendant le focus', async () => {
    fixture.autoDetectChanges();
    document.body.appendChild(fixture.nativeElement);
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    const racine = fixture.nativeElement as HTMLElement;
    expect(racine.querySelector('.titre p')?.textContent).toBe('Étudiant');
    expect(racine.querySelector('h2 a')?.getAttribute('href')).toBe('/profil/u-2');

    const plus = racine.querySelector<HTMLButtonElement>('.bouton-plus')!;
    plus.click();
    await fixture.whenStable();
    expect(plus.getAttribute('aria-expanded')).toBe('true');
    expect(racine.querySelector('#menu-fil a')?.textContent?.trim()).toBe('Voir le profil');

    racine.querySelector<HTMLElement>('#menu-fil a')!.focus();
    racine.querySelector('#menu-fil a')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();
    expect(racine.querySelector('#menu-fil')).toBeNull();
    await vi.waitFor(() => expect(document.activeElement).toBe(racine.querySelector('.bouton-plus')));
    fixture.nativeElement.remove();
  });

  it('groupe : bulles avec le nom de l’auteur, et « Détails du groupe » dans le même menu « ⋯ »', async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; };
    const groupe: ConversationDetail = {
      ...detailDirect, type: 'GROUPE', nom: 'Promo 2018', monRole: 'ADMINISTRATEUR',
      participants: [...detailDirect.participants,
        { id: 'u-3', prenom: 'Fatou', nom: 'Sall', nomAffiche: 'Fatou Sall', urlPhoto: null, role: 'ALUMNI', roleParticipant: 'MEMBRE' }],
    };
    fixture.autoDetectChanges();
    document.body.appendChild(fixture.nativeElement);
    await charger([
      message('m1', 'Salut', false), message('m2', 'Ça va ?', false, '2026-11-14T09:30:30Z'),
      message('m3', 'Oui', true, '2026-11-14T09:31:00Z'),
    ], false, groupe);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('.titre p')?.textContent).toBe('Groupe · 3 participants');
    const lignes = [...racine.querySelectorAll('app-message-fil')];
    expect(lignes.map((l) => l.querySelector('.auteur')?.textContent?.trim() ?? null)).toEqual(['Moussa Ndiaye', null, null]);
    expect(lignes.every((l) => l.querySelector('.bulle'))).toBe(true);

    racine.querySelector<HTMLButtonElement>('.bouton-plus')!.click();
    await fixture.whenStable();
    const details = [...racine.querySelectorAll<HTMLButtonElement>('#menu-fil button')];
    expect(details.map((b) => b.textContent?.trim())).toEqual(['Infos du groupe']);
    details[0].click();
    await fixture.whenStable();
    const dialogue = racine.querySelector('app-details-groupe dialog') as HTMLDialogElement;
    expect(dialogue.open).toBe(true);

    dialogue.close();
    dialogue.dispatchEvent(new Event('close'));
    await vi.waitFor(() => expect(document.activeElement).toBe(racine.querySelector('.bouton-plus')));
    fixture.nativeElement.remove();
  });

  it('ferme la saisie sans dire pourquoi quand l’interlocuteur m’a bloqué', async () => {
    await charger([message('m1', 'Bonjour Awa', false)], false, { ...detailDirect, ecriture: 'FERMEE' });
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    const racine = fixture.nativeElement as HTMLElement;

    expect(racine.querySelector('app-zone-saisie')).toBeNull();
    const bandeau = racine.querySelector('app-bandeau-blocage')?.textContent ?? '';
    expect(bandeau).toContain('Vous ne pouvez plus écrire dans cette conversation.');
    expect(bandeau).not.toContain('bloqué');
  });

  it('remplace la saisie par le bandeau quand un envoi est refusé parce que la conversation s’est fermée', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    const racine = fixture.nativeElement as HTMLElement;
    const champ = racine.querySelector('app-zone-saisie textarea') as HTMLTextAreaElement;
    champ.value = 'Tu es là ?';
    champ.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (racine.querySelector('app-zone-saisie button[type="submit"]') as HTMLButtonElement).click();
    http.expectOne((req) => req.method === 'POST' && req.url === '/api/messagerie/conversations/c-1/messages').flush(
      { message: 'Vous ne pouvez plus écrire dans cette conversation.' }, { status: 409, statusText: 'Conflict' });
    await fixture.whenStable();
    http.expectOne('/api/messagerie/conversations/c-1').flush({ ...detailDirect, ecriture: 'FERMEE' });
    fixture.detectChanges();

    expect(racine.querySelector('app-zone-saisie')).toBeNull();
    expect(etat.actualiser).toHaveBeenCalled();
    await vi.waitFor(() => expect(document.activeElement).toBe(racine.querySelector('app-bandeau-blocage .bandeau')));
  });

  it('recharge le fil quand le flux signale un message dans cette conversation, et seulement celle-ci', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);

    signaux.next({ type: 'message', conversationId: 'autre' });
    http.expectNone((req) => req.url.includes('/messages'));

    signaux.next({ type: 'message', conversationId: 'c-1' });
    http.expectOne((req) => req.url === '/api/messagerie/conversations/c-1/messages')
      .flush({ messages: [message('m2', 'Tu es là ?', false, '2026-11-14T09:35:00Z')], plusAnciens: false });
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    await fixture.whenStable();
    fixture.detectChanges();
    const textes = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.bulle p')].map((p) => p.textContent?.trim());
    expect(textes).toEqual(['Bonjour Awa', 'Tu es là ?']);
  });

  it('ne marque rien comme lu quand seuls mes propres messages arrivent', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    etat.marquerLue.mockClear();

    signaux.next({ type: 'message', conversationId: 'c-1' });
    http.expectOne((req) => req.url === '/api/messagerie/conversations/c-1/messages')
      .flush({ messages: [message('m2', 'Depuis mon téléphone', true, '2026-11-14T09:35:00Z')], plusAnciens: false });
    http.expectNone('/api/messagerie/conversations/c-1/lu');
    expect(etat.marquerLue).not.toHaveBeenCalled();
  });

  it('garde la pastille si le serveur refuse la lecture : la liste reste fidèle au serveur', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(etat.marquerLue).not.toHaveBeenCalled();
  });

  it('recompte le badge lui-même après la lecture quand le flux temps réel est coupé', async () => {
    connecte.set(false);
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);
    expect(etat.marquerLue).toHaveBeenCalledWith('c-1');
    expect(compteur.actualiser).toHaveBeenCalledOnce();
  });

  it('ignore le signal « lu » : la lecture ne recharge ni le détail ni les messages', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);

    signaux.next({ type: 'lu', conversationId: 'c-1' });
    http.expectNone((req) => req.url.startsWith('/api/messagerie/conversations/c-1'));
  });

  it('annonce que l’on ne fait plus partie de la conversation quand on en est retiré', async () => {
    await charger([message('m1', 'Bonjour Awa', false)]);
    http.expectOne('/api/messagerie/conversations/c-1/lu').flush(null);

    signaux.next({ type: 'conversation', conversationId: 'c-1' });
    http.expectOne('/api/messagerie/conversations/c-1').flush({ message: 'introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('ne faites plus partie');
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
