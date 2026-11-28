import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { Message } from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PieceJointeMessage } from '../piece-jointe/piece-jointe-message';
import { messageServeur } from '../message-erreur';

/** Teintes foncées, toutes au-dessus de 4,5:1 sur blanc (WCAG AA), pour le nom des auteurs d’un groupe. */
const COULEURS_AUTEURS = ['#014365', '#1F6447', '#7C5820', '#5B3E96', '#0B6577', '#9A3B5C'];

/** Couleur stable d’un membre : la même d’un message et d’une session à l’autre. */
export function couleurDuMembre(id: string): string {
  let somme = 0;
  for (const caractere of id) somme = (somme * 31 + caractere.charCodeAt(0)) >>> 0;
  return COULEURS_AUTEURS[somme % COULEURS_AUTEURS.length];
}

/**
 * Un message du fil : une bulle, les miennes à droite, en conversation privée comme en groupe ; dans un groupe,
 * le nom de l’auteur coiffe la première bulle d’une série. L’auteur peut supprimer son message après
 * confirmation dans une petite fenêtre modale ; il reste affiché « Message supprimé », sans cadre, et ceux qui se suivent tiennent en une ligne.
 */
@Component({
  selector: 'app-message-fil',
  imports: [AvatarMembre, DatePipe, PieceJointeMessage],
  templateUrl: './message-fil.html',
  styleUrl: './message-fil.scss',
  host: {
    '[class.de-moi]': 'message().deMoi',
    '[class.suite]': 'suite()',
    '[class.actions-visibles]': 'actionsVisibles()',
  },
})
export class MessageFil {
  private readonly messagerie = inject(MessagerieService);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly dialogue = viewChild<ElementRef<HTMLDialogElement>>('dialogue');
  readonly message = input.required<Message>();
  readonly conversationId = input.required<string>();
  /** Dans un groupe, le nom de l’auteur s’affiche au-dessus de ses bulles. */
  readonly groupe = input(false);
  readonly suite = input(false);
  /** Nombre de messages supprimés d’affilée que cette ligne résume (voir `lignesDuFil`). */
  readonly supprimes = input(0);
  readonly supprime = output<string>();

  /** Une couleur par membre, toujours la même, pour reconnaître les auteurs d’un coup d’œil dans un groupe. */
  protected readonly couleurAuteur = computed(() => couleurDuMembre(this.message().auteurId));
  protected readonly confirmation = signal(false);
  /** Écran tactile (sans survol) : la corbeille n’apparaît qu’après un appui sur mon message. */
  protected readonly actionsVisibles = signal(false);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  /** Un appui sur un lien ou un bouton de la bulle (image, fichier) garde son propre effet. */
  protected basculerActions(evenement: MouseEvent): void {
    if (!this.message().deMoi || (evenement.target as Element).closest('a, button')) return;
    this.actionsVisibles.update((visibles) => !visibles);
  }

  /** La fenêtre s’ouvre avec le focus sur « Annuler », le choix sans risque. */
  protected ouvrirConfirmation(): void {
    this.actionsVisibles.set(false);
    this.confirmation.set(true);
    afterNextRender(() => {
      this.dialogue()?.nativeElement.showModal();
      this.hote.nativeElement.querySelector<HTMLElement>('.confirmation .annuler')?.focus();
    }, { injector: this.injector });
  }

  protected annuler(): void {
    this.dialogue()?.nativeElement.close();
  }

  /** Fermeture par « Annuler » ou Échap : le focus revient à la corbeille (sauf si le message vient d’être supprimé). */
  protected confirmationFermee(): void {
    if (!this.confirmation()) return;
    this.confirmation.set(false);
    this.erreur.set(null);
    this.focaliser('.ouvrir-suppression');
  }

  private focaliser(selecteur: string): void {
    afterNextRender(() => this.hote.nativeElement.querySelector<HTMLElement>(selecteur)?.focus(), { injector: this.injector });
  }

  protected supprimer(): void {
    this.enCours.set(true);
    this.erreur.set(null);
    this.messagerie.supprimerMessage(this.conversationId(), this.message().id).subscribe({
      next: () => {
        this.enCours.set(false);
        this.confirmation.set(false);
        this.dialogue()?.nativeElement.close();
        this.supprime.emit(this.message().id);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(messageServeur(erreur, 'La suppression a échoué. Réessayez.'));
      },
    });
  }
}
