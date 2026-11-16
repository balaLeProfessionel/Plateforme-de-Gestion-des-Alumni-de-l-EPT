import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, effect, ElementRef, inject, Injector, input, output, signal, viewChild,
} from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import {
  ConversationDetail, LONGUEUR_MAX_DESCRIPTION_GROUPE, LONGUEUR_MAX_NOM_GROUPE, MembreChoisi, MembreConversation,
  MEMBRES_MAX_PAR_AJOUT,
} from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PhotoGroupe } from '../photo-groupe/photo-groupe';
import { SelectionMembres } from '../selection-membres/selection-membres';

/** Action en attente de confirmation sur la ligne d’un membre. */
interface ActionMembre {
  type: 'retirer' | 'role';
  membreId: string;
}

/**
 * Fenêtre « Détails du groupe » : photo, description et participants pour tous ; l’administrateur modifie le
 * groupe, nomme d’autres administrateurs, ajoute, retire et supprime le groupe ; chacun peut le quitter.
 */
@Component({
  selector: 'app-details-groupe',
  imports: [FormField, AvatarMembre, PhotoGroupe, SelectionMembres],
  templateUrl: './details-groupe.html',
  styleUrl: './details-groupe.scss',
})
export class DetailsGroupe {
  private readonly messagerie = inject(MessagerieService);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  /** Où rendre le focus quand la question en cours se ferme (le bouton qui l’a ouverte a disparu). */
  private retourFocus: string | null = null;
  private readonly dialogue = viewChild.required<ElementRef<HTMLDialogElement>>('dialogue');
  readonly detail = input<ConversationDetail | null>(null);
  readonly ouvert = input(false);
  readonly fermee = output<void>();
  readonly modifie = output<ConversationDetail>();
  readonly quitte = output<void>();

  protected readonly longueurDescription = LONGUEUR_MAX_DESCRIPTION_GROUPE;
  protected readonly moiId = computed(() => this.authService.utilisateur()?.id);
  protected readonly administrateur = computed(() => this.detail()?.monRole === 'ADMINISTRATEUR');
  protected readonly participantIds = computed(() => this.detail()?.participants.map((membre) => membre.id) ?? []);
  protected readonly nombreAdministrateurs = computed(() =>
    this.detail()?.participants.filter((membre) => membre.roleParticipant === 'ADMINISTRATEUR').length ?? 0);

  protected readonly modele = signal({ nom: '', description: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.nom, { message: 'Donnez un nom au groupe.' });
    validate(champ.nom, ({ value }) => value().trim() === '' && value() !== ''
      ? { kind: 'vide', message: 'Donnez un nom au groupe.' } : undefined);
    maxLength(champ.nom, LONGUEUR_MAX_NOM_GROUPE,
      { message: `Le nom ne peut pas dépasser ${LONGUEUR_MAX_NOM_GROUPE} caractères.` });
    maxLength(champ.description, LONGUEUR_MAX_DESCRIPTION_GROUPE,
      { message: `La description ne peut pas dépasser ${LONGUEUR_MAX_DESCRIPTION_GROUPE} caractères.` });
  });
  /** Le formulaire diffère du groupe enregistré : le bouton « Enregistrer » s’active. */
  protected readonly modifieLocalement = computed(() => {
    const detail = this.detail();
    const { nom, description } = this.modele();
    return !!detail && (nom.trim() !== detail.nom || description.trim() !== (detail.description ?? ''));
  });
  protected readonly nouveaux = signal<MembreChoisi[]>([]);
  protected readonly actionMembre = signal<ActionMembre | null>(null);
  protected readonly confirmerDepart = signal(false);
  protected readonly confirmerSuppression = signal(false);
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
    // Une question de confirmation prend la place du bouton cliqué : elle reçoit le focus, puis le rend.
    effect(() => {
      const action = this.actionMembre();
      const depart = this.confirmerDepart();
      const suppression = this.confirmerSuppression();
      if (action || depart || suppression) {
        const zone = action ? `li[data-membre="${action.membreId}"]` : 'footer';
        this.retourFocus = action ? `${zone} button` : depart ? '.actions-depart .danger' : '.actions-depart .danger-texte';
        this.focaliser(`${zone} .confirmer button`);
      } else if (this.retourFocus) {
        this.focaliser(this.retourFocus);
        this.retourFocus = null;
      }
    });
  }

  /** Focalise l’élément voulu après le rendu ; s’il n’existe plus (membre retiré), le titre de la fenêtre. */
  private focaliser(selecteur: string): void {
    afterNextRender(() => {
      const dialogue = this.dialogue().nativeElement;
      if (!dialogue.open) return;
      const cible = dialogue.querySelector<HTMLElement>(`${selecteur}:not(:disabled)`)
        ?? dialogue.querySelector<HTMLElement>('#titre-details');
      cible?.focus();
    }, { injector: this.injector });
  }

  /** Peut-on changer le rôle de ce membre ? Le dernier administrateur ne peut pas redevenir simple membre. */
  protected roleModifiable(membre: MembreConversation): boolean {
    return this.administrateur()
      && (membre.roleParticipant === 'MEMBRE' || this.nombreAdministrateurs() > 1);
  }

  protected async enregistrer(evenement: Event): Promise<void> {
    evenement.preventDefault();
    const detail = this.detail();
    if (!detail) return;
    await submit(this.formulaire, async () => {
      const { nom, description } = this.modele();
      await this.executer(this.messagerie.modifierGroupe(detail.id, { nom: nom.trim(), description: description.trim() }),
        'Le groupe est enregistré.');
      return undefined;
    });
    if (this.formulaire.nom().invalid()) this.dialogue().nativeElement.querySelector<HTMLInputElement>('#nom-groupe')?.focus();
  }

  protected photoModifiee(detail: ConversationDetail): void {
    this.confirmation.set(detail.urlPhoto ? 'La photo du groupe est enregistrée.' : 'La photo du groupe est retirée.');
    this.modifie.emit(detail);
  }

  protected async ajouter(): Promise<void> {
    const detail = this.detail();
    if (!detail || this.nouveaux().length === 0 || this.ajoutTropGrand()) return;
    const nombre = this.nouveaux().length;
    const ok = await this.executer(this.messagerie.ajouterParticipants(detail.id, this.nouveaux().map((m) => m.id)),
      nombre > 1 ? `${nombre} membres ont été ajoutés.` : 'Le membre a été ajouté.');
    if (ok) this.nouveaux.set([]);
  }

  protected async changerRole(membre: MembreConversation): Promise<void> {
    const detail = this.detail();
    if (!detail) return;
    const nomme = membre.roleParticipant === 'MEMBRE';
    const ok = await this.executer(
      this.messagerie.changerRole(detail.id, membre.id, nomme ? 'ADMINISTRATEUR' : 'MEMBRE'),
      nomme ? `${membre.nomAffiche} est maintenant administrateur.` : `${membre.nomAffiche} n’est plus administrateur.`);
    if (ok) this.actionMembre.set(null);
  }

  protected async retirer(utilisateurId: string): Promise<void> {
    const detail = this.detail();
    if (!detail) return;
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      await firstValueFrom(this.messagerie.retirerParticipant(detail.id, utilisateurId));
      const restant = await firstValueFrom(this.messagerie.obtenir(detail.id));
      this.actionMembre.set(null);
      this.confirmation.set('Le membre a été retiré du groupe.');
      this.modifie.emit(restant);
    } catch (erreur) {
      this.erreur.set(this.messageErreur(erreur));
    } finally {
      this.enCours.set(false);
    }
  }

  protected quitter(): Promise<void> {
    const detail = this.detail();
    const moi = this.moiId();
    if (!detail || !moi) return Promise.resolve();
    return this.terminer(this.messagerie.retirerParticipant(detail.id, moi));
  }

  protected supprimer(): Promise<void> {
    const detail = this.detail();
    return detail ? this.terminer(this.messagerie.supprimerGroupe(detail.id)) : Promise.resolve();
  }

  /** Quitter ou supprimer : la fenêtre se ferme et le fil revient à la liste. */
  private async terminer(requete: Observable<void>): Promise<void> {
    this.enCours.set(true);
    this.erreur.set(null);
    try {
      await firstValueFrom(requete, { defaultValue: undefined });
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
    this.modele.set({ nom: this.detail()?.nom ?? '', description: this.detail()?.description ?? '' });
    this.formulaire().reset();
    this.nouveaux.set([]);
    this.actionMembre.set(null);
    this.confirmerDepart.set(false);
    this.confirmerSuppression.set(false);
    this.erreur.set(null);
    this.confirmation.set(null);
  }
}
