import { provideHttpClient } from '@angular/common/http';
import { HttpEventType } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EvenementMessagerie, FluxMessagerie, LecteurSse } from './flux-messagerie';

describe('LecteurSse', () => {
  it('ne rend que les événements complets et garde la suite pour la prochaine lecture', () => {
    const lecteur = new LecteurSse();
    expect(lecteur.lire('event:pret\ndata:{}\n\nevent:message\ndata:{"conversation')).toEqual([{ type: 'pret' }]);
    expect(lecteur.lire('event:pret\ndata:{}\n\nevent:message\ndata:{"conversationId":"c1"}\n\n'))
      .toEqual([{ type: 'message', conversationId: 'c1' }]);
  });

  it('reconnaît le signal de lecture venu d’un autre onglet', () => {
    expect(new LecteurSse().lire('event:lu\ndata:{"conversationId":"c1"}\n\n'))
      .toEqual([{ type: 'lu', conversationId: 'c1' }]);
  });

  it('ignore les commentaires d’entretien et les événements inconnus ou mal formés', () => {
    const lecteur = new LecteurSse();
    expect(lecteur.lire(':ok\n\nevent:autre\ndata:{}\n\nevent:conversation\ndata:pas du json\n\n')).toEqual([]);
  });
});

describe('FluxMessagerie', () => {
  let flux: FluxMessagerie;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    flux = TestBed.inject(FluxMessagerie);
    http = TestBed.inject(HttpTestingController);
  });

  it('se dit connecté au signal « pret » et relaie les signaux reçus', () => {
    const recus: EvenementMessagerie[] = [];
    const abonnement = flux.evenements.subscribe((evenement) => recus.push(evenement));
    const requete = http.expectOne('/api/messagerie/flux');
    expect(flux.connecte()).toBe(false);

    const texte = 'event:pret\ndata:{}\n\n';
    requete.event({ type: HttpEventType.DownloadProgress, loaded: texte.length, partialText: texte });
    expect(flux.connecte()).toBe(true);

    const suite = texte + 'event:message\ndata:{"conversationId":"c1"}\n\n';
    requete.event({ type: HttpEventType.DownloadProgress, loaded: suite.length, partialText: suite });
    expect(recus).toEqual([{ type: 'pret' }, { type: 'message', conversationId: 'c1' }]);

    abonnement.unsubscribe();
    expect(requete.cancelled).toBe(true);
  });

  it('se reconnecte quand la connexion tombe', () => {
    vi.useFakeTimers();
    try {
      flux.demarrer();
      http.expectOne('/api/messagerie/flux').error(new ProgressEvent('error'));
      expect(flux.connecte()).toBe(false);
      vi.advanceTimersByTime(1_000);
      http.expectOne('/api/messagerie/flux');
      flux.arreter();
    } finally {
      vi.useRealTimers();
    }
  });
});
