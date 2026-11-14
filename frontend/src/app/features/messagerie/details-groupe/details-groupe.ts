import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, effect, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormField, form, maxLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import {
  ConversationDetail, LONGUEUR_MAX_NOM_GROUPE, MembreChoisi, MEMBRES_MAX_PAR_AJOUT,
} from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { SelectionMembres } from '../selection-membres/selection-membres';

/**
 * Fenêtre « Détails du groupe » : les participants pour tous ; renommer, ajouter et retirer pour
 * l’administrateur ; quitter le groupe pour chacun.
 */
@Component({
  selector: 'app-details-groupe',
  imports: [FormField, AvatarMembre, SelectionMembres],
  templateUrl: './details-groupe.html',
  styleUrl: './details-groupe.scss',
})
export class DetailsGroupe {
  private readonly messagerie = inject(MessagerieService);
  private readonly authService = inject(AuthService);
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  readonly detail = input<ConversationDetail | null>(null);
  readonly ouvert = input(false);
  readonly fermee = output<void>();
  readonly modifie = output<ConversationDetail>();
  readonly quitte = output<void>();

  protected readonly moiId = computed(() => this.authService.utilisateur()?.id);
  protected readonly administrateur = computed(() => this.detail()?.monRole === 'ADMINISTRATEUR');
  protected readonly participantIds = computed(() => this.detail()?.participants.map((membre) => membre.id) ?? []);

  protected readonly modele = signal({ nom: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Donnez un nom au groupe.' });
    maxLength(champ.nom, LONGUEUR_MAX_NOM_GROUPE,
      { message: `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_GROUPE} caractères.` });
  });
  protected readonly nouveaux = signal<MembreChoisi[]>([]);
  protected readonly aRetirer = signal<string | null>(null);
  protected readonly confirmerDepart = signal(false);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly confirmation = signal<string | null>(null);
  protected readonly ajoutTropGrand = computed(() => this.nouveaux().length > MEMBRES_MAX_PAR_AJOUT);

  constructor() {
    effect(() => {
      const dialogue = this.dialogue().nativeElement;
      if (this.ouvert()) {
        if (!dialogue.open) {
          this.reinitialiser();
          dialogue.showModal();
        }
      } else if (dialogue.open) {
        dialogue.close();
      }
    });
  }

  protected async renommer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    const detail = this.detail();
    if (!detail) return;
    await submit(this.formulaire, async () => {
      await this.executer(this.messagerie.renommer(detail.id, this.modele().nom.trim()), 'Le groupe est renommé.');
      return undefined;
    });
  }

  protected async ajouter(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.nouveaux().length === 0 || this.ajoutTropGrand()) return;
    const nombre = this.nouveaux().length;
    const ok = await this.executer(this.messagerie.ajouterParticipants(detail.id, this.nouveaux().map((m) => m.id)),
      nombre > 1 ? `${nombre} membres ont été ajoutés.` : 'Le membre a été ajouté.');
    if (ok) this.nouveaux.set([]);
  }

  protected async retirer(utilisateurId: string): Promise<void> {
    const detail = this.detail();
    if (!detail) return;
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      await firstValueFrom(this.messagerie.retirerParticipant(detail.id, utilisateurId));
      const restant = await firstValueFrom(this.messagerie.obtenir(detail.id));
      this.aRetirer.set(null);
      this.confirmation.set('Le membre a été retiré du groupe.');
      this.modifie.emit(restant);
    } catch (erreur) {
      this.erreur.set(this.messageErreur(erreur));
    } finally {
      this.enCours.set(false);
    }
  }

  protected async quitter(): Promise<void> {
    const detail = this.detail();
    const moi = this.moiId();
    if (!detail || !moi) return;
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      await firstValueFrom(this.messagerie.retirerParticipant(detail.id, moi));
      this.dialogue().nativeElement.close();
      this.quitte.emit();
    } catch (erreur) {
      this.erreur.set(this.messageErreur(erreur));
    } finally {
      this.enCours.set(false);
    }
  }

  private async executer(requete: Observable<ConversationDetail>, succes: string): Promise<boolean> {
    this.enCours.set(true);
    this.erreur.set(null);
    this.confirmation.set(null);
    try {
      const detail = await firstValueFrom(requete);
      this.confirmation.set(succes);
      this.modifie.emit(detail);
      return true;
    } catch (erreur) {
      this.erreur.set(this.messageErreur(erreur));
      return false;
    } finally {
      this.enCours.set(false);
    }
  }

  private messageErreur(erreur: unknown): string {
    return erreur instanceof HttpErrorResponse && erreur.error?.message
      ? erreur.error.message : 'L’opération a échoué. Réessayez.';
  }

  private reinitialiser(): void {
    this.modele.set({ nom: this.detail()?.nom ?? '' });
    this.formulaire().reset();
    this.nouveaux.set([]);
    this.aRetirer.set(null);
    this.confirmerDepart.set(false);
    this.erreur.set(null);
    this.confirmation.set(null);
  }
}
