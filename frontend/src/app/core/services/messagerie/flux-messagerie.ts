import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { defer, Observable, repeat, retry, share, Subscription, timer } from 'rxjs';

const URL_FLUX = '/api/messagerie/flux';
/** Après une coupure, on réessaie de plus en plus tard, sans dépasser ce délai. */
export const DELAI_RECONNEXION_MAX = 30_000;
const DELAI_RECONNEXION_MIN = 1_000;
/**
 * Le serveur écrit au moins toutes les 25 secondes. Au-delà de ce silence, la connexion est morte sans l’avoir
 * dit (serveur redémarré derrière un proxy, réseau perdu) : on la ferme pour en rouvrir une.
 */
export const SILENCE_MAX = 60_000;

/**
 * Signal reçu en temps réel. `pret` arrive à chaque (re)connexion : ce qui a pu changer pendant
 * la coupure doit alors être rechargé. Les autres disent seulement quelle conversation a changé ;
 * `lu` vient de moi seul (un autre onglet a lu la conversation) : seuls la liste et le badge changent.
 */
export type EvenementMessagerie =
  | { type: 'pret' }
  | { type: 'message' | 'conversation' | 'lu'; conversationId: string };

/**
 * Flux temps réel de la messagerie (Server-Sent Events). Il passe par HttpClient et non par
 * `EventSource` : l’intercepteur ajoute ainsi le jeton et le rafraîchit s’il a expiré.
 * Le serveur ferme la connexion toutes les 10 minutes ; elle est aussitôt rouverte.
 */
@Service()
export class FluxMessagerie {
  private readonly http = inject(HttpClient);
  private readonly connecteSignal = signal(false);
  private connexion?: Subscription;
  /** Vrai quand le flux est ouvert : les relèves périodiques deviennent alors inutiles. */
  readonly connecte = this.connecteSignal.asReadonly();

  readonly evenements: Observable<EvenementMessagerie> = defer(() => this.ouvrir()).pipe(
    repeat({ delay: DELAI_RECONNEXION_MIN }),
    retry({
      delay: (_erreur, tentative) =>
        timer(Math.min(DELAI_RECONNEXION_MIN * 2 ** (tentative - 1), DELAI_RECONNEXION_MAX)),
      resetOnSuccess: true,
    }),
    share(),
  );

  /** Garde le flux ouvert tant que l’espace membre est affiché, même sans autre abonné. */
  demarrer(): void {
    this.connexion ??= this.evenements.subscribe();
  }

  arreter(): void {
    this.connexion?.unsubscribe();
    this.connexion = undefined;
    this.connecteSignal.set(false);
  }

  private ouvrir(): Observable<EvenementMessagerie> {
    return new Observable<EvenementMessagerie>((abonne) => {
      const lecteur = new LecteurSse();
      let dernierSigneDeVie = Date.now();
      const veille = timer(SILENCE_MAX / 4, SILENCE_MAX / 4).subscribe(() => {
        if (Date.now() - dernierSigneDeVie < SILENCE_MAX) return;
        requete.unsubscribe();
        this.connecteSignal.set(false);
        abonne.error(new Error('Flux de la messagerie silencieux.'));
      });
      const requete = this.http.get(URL_FLUX, { observe: 'events', reportProgress: true, responseType: 'text' })
        .subscribe({
          next: (evenement: HttpEvent<string>) => {
            if (evenement.type !== HttpEventType.DownloadProgress) return;
            dernierSigneDeVie = Date.now();
            for (const recu of lecteur.lire((evenement as HttpDownloadProgressEvent).partialText ?? '')) {
              if (recu.type === 'pret') this.connecteSignal.set(true);
              abonne.next(recu);
            }
          },
          error: (erreur: unknown) => {
            this.connecteSignal.set(false);
            abonne.error(erreur);
          },
          complete: () => {
            this.connecteSignal.set(false);
            abonne.complete();
          },
        });
      return () => {
        veille.unsubscribe();
        requete.unsubscribe();
      };
    });
  }
}

/** Découpe le texte reçu jusqu’ici en événements SSE complets (séparés par une ligne vide). */
export class LecteurSse {
  private dejaLu = 0;
  private tampon = '';

  lire(texteComplet: string): EvenementMessagerie[] {
    this.tampon += texteComplet.slice(this.dejaLu);
    this.dejaLu = texteComplet.length;
    const blocs = this.tampon.replace(/\r\n/g, '\n').split('\n\n');
    this.tampon = blocs.pop() ?? '';
    return blocs.map(analyserBloc).filter((evenement): evenement is EvenementMessagerie => evenement !== null);
  }
}

function analyserBloc(bloc: string): EvenementMessagerie | null {
  let nom = 'message';
  let donnees = '';
  for (const ligne of bloc.split('\n')) {
    if (ligne.startsWith('event:')) nom = ligne.slice(6).trim();
    else if (ligne.startsWith('data:')) donnees += ligne.slice(5).trim();
  }
  if (nom === 'pret') return { type: 'pret' };
  if (nom !== 'message' && nom !== 'conversation' && nom !== 'lu') return null;
  try {
    const { conversationId } = JSON.parse(donnees) as { conversationId?: unknown };
    return typeof conversationId === 'string' ? { type: nom, conversationId } : null;
  } catch {
    return null;
  }
}
