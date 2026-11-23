import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required, validate } from '@angular/forms/signals';
import { Observable, map } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { AuthService } from '../../../core/services/auth/auth-service';
import {
  CompteAdmin, LIBELLES_ROLE_COMPTE, MOTIF_LONGUEUR_MAX, nomDuCompte, RoleAttribuable, ROLES_ATTRIBUABLES,
} from '../../../core/services/models/admin.model';
import { erreurAnnee } from '../saisie-annee';

type Panneau = 'role' | 'diplome';

/** Changer le rôle d’un compte, ou marquer diplômé un étudiant (il devient alumni, son parcours est conservé). */
@Component({
  selector: 'app-evolution-compte',
  imports: [FormField],
  templateUrl: './evolution-compte.html',
  styleUrls: ['../formulaire-admin.scss', './evolution-compte.scss'],
})
export class EvolutionCompte {
  private readonly service = inject(AdminComptesService);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly compte = input.required<CompteAdmin>();
  /** Une évolution est enregistrée : le message dit ce qui a été fait. */
  readonly modifie = output<string>();

  protected readonly libellesRole = LIBELLES_ROLE_COMPTE;
  /** Seul un super administrateur fait entrer un compte dans l’administration ou l’en fait sortir. */
  protected readonly superAdministrateur = computed(() => this.authService.aPermission('GERER_ADMINISTRATEURS'));
  /** Rien à proposer pour soi-même, un organisme, un compte suspendu (à réactiver d’abord) ou, sauf super administrateur, un administrateur. */
  protected readonly disponible = computed(() => {
    const compte = this.compte();
    return compte.id !== this.authService.utilisateur()?.id && compte.role !== 'ORGANISME' && compte.statutCompte !== 'SUSPENDU'
      && (compte.role !== 'ADMIN' || this.superAdministrateur());
  });
  /** Le rôle Administrateur ne se donne qu’à un compte vérifié : le serveur refuse aussi les autres cas. */
  protected readonly rolesPossibles = computed(() => ROLES_ATTRIBUABLES.filter((role) =>
    role !== this.compte().role && (role !== 'ADMIN' || (this.compte().statutCompte === 'ACTIF' && this.superAdministrateur()))));
  protected readonly nom = computed(() => nomDuCompte(this.compte()));
  protected readonly panneau = signal<Panneau | null>(null);
  /** Deuxième étape avant de donner le rôle Administrateur : elle nomme la personne et ce qu’elle pourra faire. */
  protected readonly confirmationAdmin = signal(false);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  private readonly anneeCourante = new Date().getFullYear();
  protected readonly modele = signal({ role: '' as RoleAttribuable | '', motif: '', anneeSortie: String(this.anneeCourante) });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.role, { message: 'Choisissez le nouveau rôle.', when: () => this.panneau() === 'role' });
    required(champ.motif, { message: 'Indiquez le motif.', when: () => this.panneau() === 'role' });
    maxLength(champ.motif, MOTIF_LONGUEUR_MAX, { message: `${MOTIF_LONGUEUR_MAX} caractères au maximum.` });
    required(champ.anneeSortie, { message: 'Indiquez l’année de sortie.', when: () => this.panneau() === 'diplome' });
    validate(champ.anneeSortie, ({ value }) => this.panneau() === 'diplome'
      ? erreurAnnee(value(), this.compte().anneeEntree ? String(this.compte().anneeEntree) : undefined) : undefined);
  });
  private readonly premierChamp = viewChild<ElementRef<HTMLElement>>('premierChamp');
  private readonly boutonConfirmation = viewChild<ElementRef<HTMLElement>>('boutonConfirmation');
  /** Seuls les messages affichés sont cités : un aria-describedby vers un id absent n’annonce rien. */
  protected readonly descriptionRole = computed(() => {
    const ids = [
      this.formulaire.role().touched() && this.formulaire.role().invalid() ? 'erreur-evolution-role' : null,
      this.modele().role === 'ADMIN' || (this.compte().statutCompte === 'EN_ATTENTE' && this.superAdministrateur())
        ? 'alerte-evolution-role' : null,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  protected ouvrir(panneau: Panneau): void {
    this.modele.set({ role: '', motif: '', anneeSortie: String(this.anneeCourante) });
    this.formulaire().reset();
    this.erreur.set(null);
    this.confirmationAdmin.set(false);
    this.panneau.set(panneau);
    this.focaliser(() => this.premierChamp()?.nativeElement);
  }

  /** Ferme le panneau (Annuler, Échap) et rend le focus au bouton qui l’avait ouvert. */
  protected fermer(): void {
    const panneau = this.panneau();
    this.panneau.set(null);
    this.confirmationAdmin.set(false);
    this.focaliser(() => this.hote.nativeElement.querySelector<HTMLElement>(`[data-action="${panneau}"]`));
  }

  protected revenirAuChoix(): void {
    this.confirmationAdmin.set(false);
    this.focaliser(() => this.premierChamp()?.nativeElement);
  }

  protected confirmer(): void {
    const panneau = this.panneau();
    this.formulaire().markAsTouched();
    if (!panneau || this.formulaire().invalid()) return;
    const saisie = this.modele();
    const compte = this.compte();
    const nom = nomDuCompte(compte);
    if (panneau === 'role' && saisie.role === 'ADMIN' && !this.confirmationAdmin()) {
      this.confirmationAdmin.set(true);
      this.focaliser(() => this.boutonConfirmation()?.nativeElement);
      return;
    }
    if (panneau === 'role' && saisie.role) {
      this.executer(this.service.changerRole(compte.id, saisie.role, saisie.motif.trim()).pipe(map(() => undefined)),
        `${nom} a désormais le rôle « ${LIBELLES_ROLE_COMPTE[saisie.role]} ».`);
    } else if (panneau === 'diplome') {
      const annee = Number(saisie.anneeSortie);
      this.executer(this.service.marquerDiplomes([compte.id], annee).pipe(map((resultat) => resultat.ignores[0]?.raison)),
        `${nom} est désormais alumni (promotion ${annee}).`);
    }
  }

  private focaliser(cible: () => HTMLElement | null | undefined): void {
    afterNextRender(() => cible()?.focus(), { injector: this.injector });
  }

  /** L’action renvoie la raison d’un refus (diplomation), ou undefined si tout s’est bien passé. */
  private executer(action: Observable<string | undefined>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    action.subscribe({
      next: (refus) => {
        this.enCours.set(false);
        if (refus) {
          this.erreur.set(refus);
          return;
        }
        this.panneau.set(null);
        this.confirmationAdmin.set(false);
        this.modifie.emit(message);
        // Le panneau disparaît : le focus revient au bouton « Changer le rôle », présent pour tout compte modifiable.
        this.focaliser(() => this.hote.nativeElement.querySelector<HTMLElement>('[data-action="role"]'));
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’action n’a pas pu aboutir. Réessayez.');
      },
    });
  }
}
