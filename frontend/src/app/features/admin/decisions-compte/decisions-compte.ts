import { HttpErrorResponse } from '@angular/common/http';
import {
  afterNextRender, Component, computed, ElementRef, inject, Injector, input, output, signal, viewChild,
} from '@angular/core';
import { FormField, form, maxLength, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { AuthService } from '../../../core/services/auth/auth-service';
import { CompteAdmin, MOTIF_LONGUEUR_MAX, nomDuCompte } from '../../../core/services/models/admin.model';

type Panneau = 'refus' | 'suspension' | 'reactivation';

const PANNEAUX: Record<Panneau, { libelle: string; bouton: string; obligatoire: boolean }> = {
  refus: { libelle: 'Motif du refus (communiqué au demandeur)', bouton: 'Confirmer le refus', obligatoire: true },
  suspension: { libelle: 'Motif de la suspension (communiqué au membre)', bouton: 'Confirmer la suspension', obligatoire: true },
  reactivation: { libelle: 'Note de réactivation (facultative)', bouton: 'Confirmer la réactivation', obligatoire: false },
};

/**
 * Décisions possibles sur un compte selon son statut, avec le motif saisi sur place.
 * Partagé par la ligne d’une liste et la fiche ; la validation est confiée au parent
 * (la liste la diffère pour pouvoir l’annuler, la fiche l’envoie aussitôt).
 * Le contenu projeté (liens, historique) se range à la suite des boutons.
 */
@Component({
  selector: 'app-decisions-compte',
  imports: [FormField],
  templateUrl: './decisions-compte.html',
  styleUrl: './decisions-compte.scss',
})
export class DecisionsCompte {
  private readonly service = inject(AdminComptesService);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly compte = input.required<CompteAdmin>();
  /** Un refus, une suspension ou une réactivation est enregistré : le message dit ce qui a été fait. */
  readonly modifie = output<string>();
  readonly validationDemandee = output<void>();

  protected readonly longueurMax = MOTIF_LONGUEUR_MAX;
  protected readonly panneau = signal<Panneau | null>(null);
  protected readonly configuration = computed(() => {
    const panneau = this.panneau();
    return panneau ? PANNEAUX[panneau] : null;
  });
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly estMoi = computed(() => this.compte().id === this.authService.utilisateur()?.id);
  private readonly nomComplet = computed(() => nomDuCompte(this.compte()));

  protected readonly modele = signal({ motif: '' });
  protected readonly formulaire = form(this.modele, (champ) => {
    required(champ.motif, { message: 'Indiquez le motif.', when: () => this.configuration()?.obligatoire ?? false });
    maxLength(champ.motif, MOTIF_LONGUEUR_MAX, { message: `Le motif ne peut pas dépasser ${MOTIF_LONGUEUR_MAX} caractères.` });
  });
  private readonly champMotif = viewChild<ElementRef<HTMLTextAreaElement>>('champMotif');

  protected ouvrir(panneau: Panneau): void {
    this.modele.set({ motif: '' });
    this.formulaire().reset();
    this.erreur.set(null);
    this.panneau.set(panneau);
    afterNextRender(() => this.champMotif()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Ferme le panneau et rend le focus au bouton qui l’avait ouvert (Annuler ou Échap). */
  protected fermer(): void {
    const panneau = this.panneau();
    this.panneau.set(null);
    afterNextRender(() => this.hote.nativeElement.querySelector<HTMLButtonElement>(`[data-action="${panneau}"]`)?.focus(),
      { injector: this.injector });
  }

  protected valider(): void {
    this.validationDemandee.emit();
  }

  protected confirmer(): void {
    const panneau = this.panneau();
    if (!panneau) return;
    this.formulaire().markAsTouched();
    if (this.formulaire().invalid()) {
      this.champMotif()?.nativeElement.focus();
      return;
    }
    const motif = this.modele().motif.trim();
    const id = this.compte().id;
    const nom = this.nomComplet();
    if (panneau === 'refus') this.executer(this.service.refuser(id, motif), `Inscription de ${nom} refusée.`);
    else if (panneau === 'suspension') this.executer(this.service.suspendre(id, motif), `Compte de ${nom} suspendu.`);
    else this.executer(this.service.reactiver(id, motif || null), `Compte de ${nom} réactivé.`);
  }

  private executer(action: Observable<CompteAdmin>, message: string): void {
    if (this.enCours()) return;
    this.enCours.set(true);
    this.erreur.set(null);
    action.subscribe({
      next: () => {
        this.enCours.set(false);
        this.panneau.set(null);
        this.modifie.emit(message);
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’action n’a pas pu aboutir. Réessayez.');
      },
    });
  }
}
