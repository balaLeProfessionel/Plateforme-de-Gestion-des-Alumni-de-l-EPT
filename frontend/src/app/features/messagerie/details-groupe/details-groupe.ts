import {
  afterNextRender, Component, computed, effect, ElementRef, inject, Injector, input, output, signal, viewChild,
} from '@angular/core';
import { FormField, form, maxLength, required, submit, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth/auth-service';
import { MessagerieService } from '../../../core/services/messagerie/messagerie';
import {
  ConversationDetail, estCommunauteAutomatique, LONGUEUR_MAX_DESCRIPTION_GROUPE, LONGUEUR_MAX_NOM_GROUPE, MembreChoisi, MembreConversation,
  MEMBRES_MAX_PAR_AJOUT, NATURES_COMMUNAUTE, ROLES_COMMUNAUTE,
} from '../../../core/services/models/messagerie.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PhotoGroupe } from '../photo-groupe/photo-groupe';
import { SelectionMembres } from '../selection-membres/selection-membres';
import { messageServeur } from '../message-erreur';

/** Membres montrés d’abord, puis à chaque « Afficher plus ». */
const MEMBRES_PAR_PAGE = 10;

/** Action en attente de confirmation sur la ligne d’un membre. */
interface ActionMembre {
  type: 'retirer' | 'role';
  membreId: string;
}

/**
 * Fenêtre « Infos du groupe », en fiche comme dans les messageries courantes : grande photo, nom et nombre de
 * participants, puis des cartes (description, participants, sortie). L’administrateur modifie le groupe au crayon,
 * gère chaque membre par son menu « ⋯ », ajoute des membres et supprime le groupe ; chacun peut le quitter.
 */
@Component({
  selector: 'app-details-groupe',
  imports: [FormField, RouterLink, AvatarMembre, PhotoGroupe, SelectionMembres],
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
  /** Nom, description et suppression : ceux d’un groupe ; ceux d’une communauté relèvent de l’administration. */
  protected readonly gereLeGroupe = computed(() => this.administrateur() && !this.detail()?.categorie);
  /** Promo ou filière : on n’en sort qu’en changeant son profil. */
  protected readonly libelleQuitter = computed(() => this.detail()?.categorie ? 'Quitter la communauté' : 'Quitter le groupe');
  protected readonly automatique = computed(() => estCommunauteAutomatique(this.detail()?.categorie));
  /** Ce que change le départ, dit avant de confirmer. */
  protected readonly texteDepart = computed(() => {
    if (this.automatique()) {
      return 'Votre profil ne vous y remettra plus. Vous pourrez revenir quand vous voudrez depuis « À découvrir ».';
    }
    return this.detail()?.categorie
      ? 'Vous pourrez la rejoindre de nouveau depuis « À découvrir ».'
      : 'Vous ne verrez plus cette conversation.';
  });
  protected readonly participantIds = computed(() => this.detail()?.participants.map((membre) => membre.id) ?? []);
  /** Dans une communauté, seuls les alumni et les étudiants sont proposés à l’ajout. */
  /** « Communauté de promo », « Communauté de ville »… : le même libellé que l’en-tête du fil. */
  protected readonly nature = computed(() => {
    const categorie = this.detail()?.categorie;
    return categorie ? NATURES_COMMUNAUTE[categorie] : null;
  });
  protected readonly rolesAjoutables =computed(() => this.detail()?.categorie ? ROLES_COMMUNAUTE : null);
  /** Les administrateurs en tête, puis les autres ; dans chaque bloc, moi d’abord, puis l’ordre reçu. */
  protected readonly membresTries = computed(() => {
    const moi = this.moiId();
    const rang = (membre: MembreConversation) =>
      (membre.roleParticipant === 'ADMINISTRATEUR' ? 0 : 2) + (membre.id === moi ? 0 : 1);
    return [...(this.detail()?.participants ?? [])].sort((a, b) => rang(a) - rang(b));
  });
  protected readonly nombreAffiches = signal(MEMBRES_PAR_PAGE);
  protected readonly membresAffiches = computed(() => this.membresTries().slice(0, this.nombreAffiches()));
  protected readonly membresRestants = computed(() => this.membresTries().length - this.membresAffiches().length);
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
  /** Le membre dont le petit menu « ⋯ » est ouvert. */
  protected readonly menuMembre = signal<string | null>(null);
  /** Nom et description en cours de modification (crayon de l’en-tête). */
  protected readonly edition = signal(false);
  protected readonly ajoutOuvert = signal(false);
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
        const zone = action ? `li[data-membre="${action.membreId}"]` : '.sortie';
        this.retourFocus = action ? `${zone} .plus-membre` : depart ? '.quitter' : '.supprimer-groupe';
        this.focaliser(`${zone} .confirmer button`);
      } else if (this.retourFocus) {
        this.focaliser(this.retourFocus);
        this.retourFocus = null;
      }
    });
  }

  /** Montre les membres suivants ; le focus va au premier d’entre eux, pour continuer la lecture là. */
  protected afficherPlus(): void {
    const premier = this.membresTries()[this.nombreAffiches()];
    this.nombreAffiches.update((nombre) => nombre + MEMBRES_PAR_PAGE);
    if (premier) this.focaliser(`li[data-membre="${premier.id}"] .nom-membre`);
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

  protected basculerMenu(membreId: string): void {
    this.menuMembre.update((ouvert) => (ouvert === membreId ? null : membreId));
    if (this.menuMembre()) this.focaliser(`li[data-membre="${membreId}"] .menu-membre button`);
  }

  protected fermerMenu(membreId: string): void {
    this.menuMembre.set(null);
    this.focaliser(`li[data-membre="${membreId}"] .plus-membre`);
  }

  /** Une entrée du menu « ⋯ » : le menu se ferme, la question de confirmation prend sa place. */
  protected demander(type: ActionMembre['type'], membreId: string): void {
    this.menuMembre.set(null);
    this.actionMembre.set({ type, membreId });
  }

  protected ouvrirEdition(): void {
    this.modele.set({ nom: this.detail()?.nom ?? '', description: this.detail()?.description ?? '' });
    this.formulaire().reset();
    this.edition.set(true);
    this.focaliser('#nom-groupe');
  }

  protected fermerEdition(): void {
    this.edition.set(false);
    this.focaliser('.modifier');
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
      const ok = await this.executer(
        this.messagerie.modifierGroupe(detail.id, { nom: nom.trim(), description: description.trim() }),
        'Le groupe est enregistré.');
      if (ok) this.fermerEdition();
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
    return messageServeur(erreur, 'L’opération a échoué. Réessayez.');
  }

  private reinitialiser(): void {
    this.modele.set({ nom: this.detail()?.nom ?? '', description: this.detail()?.description ?? '' });
    this.formulaire().reset();
    this.nouveaux.set([]);
    this.actionMembre.set(null);
    this.menuMembre.set(null);
    this.edition.set(false);
    this.ajoutOuvert.set(false);
    this.confirmerDepart.set(false);
    this.confirmerSuppression.set(false);
    this.erreur.set(null);
    this.confirmation.set(null);
    this.nombreAffiches.set(MEMBRES_PAR_PAGE);
  }
}
