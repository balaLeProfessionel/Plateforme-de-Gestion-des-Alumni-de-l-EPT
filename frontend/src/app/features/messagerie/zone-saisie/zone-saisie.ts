import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import { LONGUEUR_MAX_MESSAGE, Message } from '../../../core/services/models/messagerie.model';
import { ACCEPT_PIECE_JOINTE, formaterTaille, verifierPieceJointe } from '../piece-jointe/pieces-jointes';
import { messageServeur } from '../message-erreur';

/** Le compteur de caractères n’apparaît qu’à l’approche de la limite. */
const SEUIL_COMPTEUR = LONGUEUR_MAX_MESSAGE - 200;

/** Zone d’écriture du fil : Entrée envoie, Maj+Entrée va à la ligne ; un fichier peut accompagner le texte. */
@Component({
  selector: 'app-zone-saisie',
  imports: [FormField],
  templateUrl: './zone-saisie.html',
  styleUrl: './zone-saisie.scss',
})
export class ZoneSaisie {
  private readonly messagerie = inject(MessagerieService);
  /** Écran tactile : Entrée va à la ligne, comme dans les messageries mobiles ; on envoie avec le bouton. */
  private readonly tactile = inject(DOCUMENT).defaultView?.matchMedia?.('(hover: none)').matches ?? false;
  private readonly champ = viewChild.required<ElementRef<HTMLTextAreaElement>>('champ');
  private readonly selecteur = viewChild.required<ElementRef<HTMLInputElement>>('selecteur');
  private readonly boutonJoindre = viewChild.required<ElementRef<HTMLButtonElement>>('joindre');
  readonly conversationId = input.required<string>();
  readonly envoye = output<Message>();
  /** Envoi refusé parce que la conversation a changé entre-temps (fermée : 409, quittée : 404). */
  readonly refuse = output<void>();

  /** Fichier choisi, envoyé avec le texte : le texte devient alors facultatif. */
  protected readonly fichier = signal<File | null>(null);
  protected readonly modele = signal({ contenu: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    maxLength(champ.contenu, LONGUEUR_MAX_MESSAGE,
      { message: `Un message ne peut pas dépasser ${LONGUEUR_MAX_MESSAGE} caractères.` });
    validate(champ.contenu, ({ value }) => value().trim() === '' && !this.fichier()
      ? { kind: 'vide', message: 'Écrivez un message ou joignez un fichier.' } : undefined);
  });
  protected readonly longueur = computed(() => this.modele().contenu.length);
  protected readonly afficherCompteur = computed(() => this.longueur() >= SEUIL_COMPTEUR);
  protected readonly tropLong = computed(() => this.longueur() > LONGUEUR_MAX_MESSAGE);
  protected readonly vide = computed(() => this.modele().contenu.trim() === '' && !this.fichier());
  protected readonly tailleFichier = computed(() => {
    const fichier = this.fichier();
    return fichier ? formaterTaille(fichier.size) : '';
  });
  protected readonly erreur = signal<string | null>(null);
  protected readonly maximum = LONGUEUR_MAX_MESSAGE;
  protected readonly accept = ACCEPT_PIECE_JOINTE;

  /** Entrée envoie ; Maj+Entrée, l’écran tactile et la composition d’un caractère (IME) gardent le retour à la ligne. */
  protected toucheEntree(evenement: Event): void {
    const clavier = evenement as KeyboardEvent;
    if (this.tactile || clavier.shiftKey || clavier.isComposing) return;
    evenement.preventDefault();
    void this.envoyer();
  }

  protected ouvrirSelecteur(): void {
    this.selecteur().nativeElement.click();
  }

  /** Un fichier refusé n’est pas gardé : le message d’erreur dit pourquoi. */
  protected fichierChoisi(evenement: Event): void {
    const entree = evenement.target as HTMLInputElement;
    const choisi = entree.files?.item(0) ?? null;
    entree.value = '';
    if (!choisi) return;
    const probleme = verifierPieceJointe(choisi);
    this.erreur.set(probleme);
    this.fichier.set(probleme ? null : choisi);
    this.champ().nativeElement.focus();
  }

  protected retirerFichier(): void {
    this.fichier.set(null);
    this.erreur.set(null);
    this.boutonJoindre().nativeElement.focus();
  }

  protected async envoyer(evenement?: Event): Promise<void> {
    evenement?.preventDefault();
    if (this.vide() || this.tropLong() || this.formulaire().submitting()) return;
    await submit(this.formulaire, async () => {
      this.erreur.set(null);
      const contenu = this.modele().contenu.trim();
      const fichier = this.fichier();
      try {
        const message = await firstValueFrom(fichier
          ? this.messagerie.envoyerAvecFichier(this.conversationId(), fichier, contenu)
          : this.messagerie.envoyer(this.conversationId(), contenu));
        this.modele.set({ contenu: '' });
        this.fichier.set(null);
        this.formulaire().reset();
        this.envoye.emit(message);
      } catch (erreur) {
        const refus = erreur instanceof HttpErrorResponse && (erreur.status === 409 || erreur.status === 404);
        this.erreur.set(messageServeur(erreur, 'Message non envoyé.'));
        if (refus) this.refuse.emit();
      }
      this.champ().nativeElement.focus();
      return undefined;
    });
  }
}
