import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, output, signal, viewChild } from '@angular/core';
import { AdminComptesService } from '../../../core/services/admin/admin-comptes';
import { AuthService } from '../../../core/services/auth/auth-service';
import { PermissionAdmin, RESPONSABILITES, Responsabilite } from '../../../core/services/models/admin.model';

/**
 * Responsabilités d’un compte d’administration, lues par toute l’administration. Seul un super administrateur les
 * modifie, et jamais les siennes : un autre super administrateur doit le faire.
 */
@Component({
  selector: 'app-responsabilites-compte',
  templateUrl: './responsabilites-compte.html',
  styleUrls: ['../formulaire-admin.scss', './responsabilites-compte.scss'],
})
export class ResponsabilitesCompte {
  private readonly service = inject(AdminComptesService);
  private readonly authService = inject(AuthService);
  private readonly injector = inject(Injector);

  readonly compteId = input.required<string>();
  readonly prenom = input<string>('');
  readonly responsabilites = input.required<readonly PermissionAdmin[]>();
  /** Les responsabilités sont enregistrées : le message dit ce qui a été fait. */
  readonly modifie = output<string>();

  protected readonly liste = RESPONSABILITES;
  protected readonly estSuper = computed(() => this.responsabilites().includes('GERER_ADMINISTRATEURS'));
  protected readonly attribuees = computed(() => RESPONSABILITES.filter((r) => this.responsabilites().includes(r.valeur)));
  protected readonly estMoi = computed(() => this.compteId() === this.authService.utilisateur()?.id);
  protected readonly peutModifier = computed(() => this.authService.aPermission('GERER_ADMINISTRATEURS') && !this.estMoi());

  protected readonly edition = signal(false);
  protected readonly superCoche = signal(false);
  protected readonly cochees = signal<readonly Responsabilite[]>([]);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);
  private readonly premiereCase = viewChild<ElementRef<HTMLInputElement>>('premiereCase');
  private readonly boutonModifier = viewChild<ElementRef<HTMLButtonElement>>('boutonModifier');

  protected ouvrir(): void {
    this.superCoche.set(this.estSuper());
    this.cochees.set(this.attribuees().map((r) => r.valeur));
    this.erreur.set(null);
    this.edition.set(true);
    afterNextRender(() => this.premiereCase()?.nativeElement.focus(), { injector: this.injector });
  }

  protected fermer(): void {
    this.edition.set(false);
    afterNextRender(() => this.boutonModifier()?.nativeElement.focus(), { injector: this.injector });
  }

  protected basculer(valeur: Responsabilite): void {
    this.cochees.update((liste) => liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur]);
  }

  /** Coché : la case vaut pour sa responsabilité, ou pour toutes si le compte est super administrateur. */
  protected estCochee(valeur: Responsabilite): boolean {
    return this.superCoche() || this.cochees().includes(valeur);
  }

  protected enregistrer(): void {
    if (this.enCours()) return;
    const choix: PermissionAdmin[] = this.superCoche() ? ['GERER_ADMINISTRATEURS'] : [...this.cochees()];
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.modifierResponsabilites(this.compteId(), choix).subscribe({
      next: () => {
        this.enCours.set(false);
        this.fermer();
        this.modifie.emit('Responsabilités enregistrées. La personne en est prévenue par e-mail.');
      },
      error: (erreur: HttpErrorResponse) => {
        this.enCours.set(false);
        this.erreur.set(erreur.error?.message ?? 'L’enregistrement a échoué. Réessayez.');
      },
    });
  }
}
