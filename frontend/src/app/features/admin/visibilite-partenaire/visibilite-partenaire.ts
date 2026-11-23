import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { Convention } from '../../../core/services/models/partenariat.model';
import { PartenairesService } from '../../../core/services/partenariats/partenaires';

/**
 * Montrer ou masquer l’organisme dans la liste des partenaires vue par les étudiants, les alumni et le personnel.
 * Le réglage vaut pour l’organisme ; il ne joue que tant qu’il a une convention active.
 */
@Component({
  selector: 'app-visibilite-partenaire',
  template: `
    @let c = convention();
    <section class="carte visibilite" aria-labelledby="titre-visibilite-partenaire">
      <h2 id="titre-visibilite-partenaire">Visibilité auprès des membres</h2>
      <label class="bascule">
        <input type="checkbox" role="switch" [checked]="visible()" [disabled]="enCours()" (change)="changer($event)" />
        <span>{{ c.organismeNom }} apparaît dans la liste des partenaires</span>
      </label>
      <p class="aide">
        @if (c.statut === 'ACTIVE') { Étudiants, alumni et personnel le voient {{ visible() ? 'tant que la convention est active' : 'pas : il est masqué' }}. }
        @else { Le réglage prendra effet quand l’organisme aura une convention active. }
      </p>
      @if (erreur(); as e) { <p class="erreur-champ" role="alert">{{ e }}</p> }
    </section>
  `,
  styleUrls: ['../formulaire-admin.scss'],
  styles: `
    .visibilite { display: grid; gap: 0.5rem; }
    .visibilite h2 { margin: 0; }
    .bascule { display: flex; align-items: center; gap: 0.6rem; color: var(--ept-primary-dark); font-weight: 600; cursor: pointer;
      input { width: 1.15rem; height: 1.15rem; accent-color: var(--ept-primary); }
      &:focus-within { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; border-radius: 6px; } }
  `,
})
export class VisibilitePartenaire {
  private readonly service = inject(PartenairesService);

  readonly convention = input.required<Convention>();
  readonly modifiee = output<boolean>();
  protected readonly visible = linkedSignal(() => this.convention().organismeVisible);
  protected readonly enCours = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected changer(evenement: Event): void {
    const case_ = evenement.target as HTMLInputElement;
    const visible = case_.checked;
    this.enCours.set(true);
    this.erreur.set(null);
    this.service.changerVisibilite(this.convention().organismeId, visible).subscribe({
      next: (r) => {
        this.enCours.set(false);
        this.visible.set(r.visible);
        this.modifiee.emit(r.visible);
      },
      error: (e: HttpErrorResponse) => {
        this.enCours.set(false);
        case_.checked = !visible;
        this.erreur.set(e.error?.message ?? 'Le réglage n’a pas pu être enregistré. Réessayez.');
      },
    });
  }
}
