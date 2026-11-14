import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, LOCALE_ID, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  catchError, distinctUntilChanged, EMPTY, filter, forkJoin, map, of, switchMap, tap, timer,
} from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteurMessages } from '../../../core/services/messagerie/compteur-messages';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { ConversationDetail, Message } from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { DetailsGroupe } from '../details-groupe/details-groupe';
import { EtatConversations } from '../etat-conversations';
import { MessageFil } from '../message-fil/message-fil';
import { ZoneSaisie } from '../zone-saisie/zone-saisie';
import { fusionnerMessages, lignesDuFil } from './blocs-messages';

/** Relève des nouveaux messages tant que le fil est ouvert et visible. */
export const INTERVALLE_FIL = 8_000;
/** En deçà de cette distance du bas, un nouveau message fait défiler le fil jusqu’à lui. */
const MARGE_BAS_PX = 120;

/** Fil d’une conversation : en-tête, historique par pages, nouveaux messages et zone de saisie. */
@Component({
  selector: 'app-fil-conversation',
  imports: [RouterLink, AvatarMembre, MessageFil, ZoneSaisie, DetailsGroupe],
  templateUrl: './fil-conversation.html',
  styleUrl: './fil-conversation.scss',
})
export class FilConversation {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly messagerie = inject(MessagerieService);
  private readonly etat = inject(EtatConversations);
  private readonly compteur = inject(CompteurMessages);
  private readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly locale = inject(LOCALE_ID);
  private readonly zone = viewChild<ElementRef<HTMLElement>>('zone');

  protected readonly conversationId = signal('');
  protected readonly detail = signal<ConversationDetail | null>(null);
  protected readonly messages = signal<Message[]>([]);
  protected readonly plusAnciens = signal(false);
  protected readonly chargement = signal(true);
  protected readonly erreur = signal<string | null>(null);
  protected readonly chargementAnciens = signal(false);
  protected readonly erreurAnciens = signal<string | null>(null);
  protected readonly detailsOuverts = signal(false);

  protected readonly lignes = computed(() => lignesDuFil(this.messages(), new Date(), this.locale));
  protected readonly estGroupe = computed(() => this.detail()?.type === 'GROUPE');
  /** L’autre personne d’une conversation directe. */
  protected readonly interlocuteur = computed(() => {
    const detail = this.detail();
    const moi = this.authService.utilisateur()?.id;
    return detail?.type === 'DIRECTE' ? detail.participants.find((membre) => membre.id !== moi) ?? null : null;
  });
  protected readonly lienProfil = computed(() => {
    const autre = this.interlocuteur();
    return autre && autre.role !== 'ORGANISME' ? ['/profil', autre.id] : null;
  });
  protected readonly sousTitre = computed(() => {
    const detail = this.detail();
    if (!detail) return '';
    if (detail.type === 'GROUPE') {
      const nombre = detail.participants.length;
      return `Groupe de ${nombre} participant${nombre > 1 ? 's' : ''}`;
    }
    return 'Conversation privée';
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    this.route.paramMap.pipe(
      map((params) => params.get('id') ?? ''),
      distinctUntilChanged(),
      tap((id) => this.reinitialiser(id)),
      switchMap((id) => forkJoin({ detail: this.messagerie.obtenir(id), page: this.messagerie.listerMessages(id) }).pipe(
        map((resultat) => ({ resultat, erreur: null })),
        catchError((erreur: HttpErrorResponse) => of({
          resultat: null,
          erreur: erreur.status === 404
            ? 'Cette conversation est introuvable, ou vous n’en faites plus partie.'
            : erreur.error?.message ?? 'Impossible de charger la conversation. Vérifiez votre connexion.',
        })))),
      takeUntilDestroyed(destroyRef),
    ).subscribe(({ resultat, erreur }) => {
      this.chargement.set(false);
      this.erreur.set(erreur);
      if (!resultat) return;
      this.detail.set(resultat.detail);
      this.messages.set(resultat.page.messages);
      this.plusAnciens.set(resultat.page.plusAnciens);
      this.defilerEnBas();
      this.marquerLu();
    });

    timer(INTERVALLE_FIL, INTERVALLE_FIL).pipe(
      filter(() => this.document.visibilityState !== 'hidden' && !this.chargement() && !this.erreur()),
      switchMap(() => this.messagerie.listerMessages(this.conversationId()).pipe(catchError(() => EMPTY))),
      takeUntilDestroyed(destroyRef),
    ).subscribe(({ messages }) => this.integrer(messages));
  }

  protected chargerAnciens(): void {
    const premier = this.messages()[0];
    const zone = this.zone()?.nativeElement;
    if (!premier || this.chargementAnciens()) return;
    this.chargementAnciens.set(true);
    this.erreurAnciens.set(null);
    const hauteurAvant = zone?.scrollHeight ?? 0;
    this.messagerie.listerMessages(this.conversationId(), premier.envoyeLe).subscribe({
      next: (page) => {
        this.messages.update((actuels) => fusionnerMessages(actuels, page.messages));
        this.plusAnciens.set(page.plusAnciens);
        this.chargementAnciens.set(false);
        // Garde sous les yeux le message qui était en haut : on décale d’autant que ce qui a été ajouté.
        afterNextRender(() => { if (zone) zone.scrollTop += zone.scrollHeight - hauteurAvant; }, { injector: this.injector });
      },
      error: () => {
        this.chargementAnciens.set(false);
        this.erreurAnciens.set('Les messages plus anciens n’ont pas pu être chargés.');
      },
    });
  }

  protected messageEnvoye(message: Message): void {
    this.messages.update((actuels) => fusionnerMessages(actuels, [message]));
    this.defilerEnBas();
    this.etat.actualiser();
  }

  protected messageSupprime(id: string): void {
    this.messages.update((actuels) => actuels.map((message) =>
      message.id === id ? { ...message, supprime: true, contenu: null } : message));
    this.etat.actualiser();
  }

  protected groupeModifie(detail: ConversationDetail): void {
    this.detail.set(detail);
    this.etat.actualiser();
  }

  protected groupeQuitte(): void {
    this.detailsOuverts.set(false);
    this.etat.actualiser();
    void this.router.navigate(['/messagerie']);
  }

  private reinitialiser(id: string): void {
    this.conversationId.set(id);
    this.detail.set(null);
    this.messages.set([]);
    this.plusAnciens.set(false);
    this.chargement.set(true);
    this.erreur.set(null);
    this.erreurAnciens.set(null);
    this.detailsOuverts.set(false);
  }

  /** Ajoute les messages relevés ; ceux des autres sont lus aussitôt puisque le fil est sous les yeux. */
  private integrer(recus: readonly Message[]): void {
    const connus = new Set(this.messages().map((message) => message.id));
    const nouveauxDesAutres = recus.some((message) => !connus.has(message.id) && !message.deMoi);
    const zone = this.zone()?.nativeElement;
    const enBas = !zone || zone.scrollHeight - zone.scrollTop - zone.clientHeight < MARGE_BAS_PX;
    this.messages.update((actuels) => fusionnerMessages(actuels, recus));
    if (!nouveauxDesAutres) return;
    if (enBas) this.defilerEnBas();
    this.marquerLu();
  }

  private marquerLu(): void {
    const id = this.conversationId();
    this.messagerie.marquerLu(id).pipe(catchError(() => EMPTY)).subscribe(() => {
      this.etat.marquerLue(id);
      this.compteur.actualiser();
    });
  }

  private defilerEnBas(): void {
    afterNextRender(() => {
      const zone = this.zone()?.nativeElement;
      if (zone) zone.scrollTop = zone.scrollHeight;
    }, { injector: this.injector });
  }
}
