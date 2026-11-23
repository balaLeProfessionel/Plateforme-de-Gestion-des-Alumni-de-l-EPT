import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth/auth-service';
import { PartenariatPublic } from '../../../core/services/models/partenariat.model';
import { PartenairesService } from '../../../core/services/partenariats/partenaires';

/** Rôles qui consultent les partenaires de l’EPT (le serveur applique la même règle). */
const LECTEURS = ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'ADMIN'];

/**
 * Bloc « Partenaire de l’EPT » sur la fiche d’un organisme : depuis quand, domaines de coopération, accords en vigueur.
 * Rien ne s’affiche si l’organisme n’est pas un partenaire visible, ni pour un compte qui ne consulte pas les partenaires.
 */
@Component({
  selector: 'app-partenariat-organisme',
  imports: [DatePipe],
  template: `
    @if (partenariat(); as p) {
      <section class="partenariat" aria-labelledby="titre-partenariat-organisme">
        <h2 id="titre-partenariat-organisme"><i class="pi pi-verified" aria-hidden="true"></i>Partenaire de l’EPT</h2>
        @if (p.partenaireDepuis) { <p>Lié à l’EPT par une convention de partenariat depuis {{ p.partenaireDepuis | date: 'MMMM y' }}.</p> }
        @if (p.domaines.length) {
          <ul class="domaines" aria-label="Domaines de coopération">@for (d of p.domaines; track d) { <li>{{ d }}</li> }</ul>
        }
        @if (p.accordsStage || p.accordsMobilite) {
          <p class="accords">Accords en vigueur :
            {{ p.accordsStage && p.accordsMobilite ? 'stage et mobilité' : p.accordsStage ? 'stage' : 'mobilité' }}.</p>
        }
      </section>
    }
  `,
  styles: `
    .partenariat { display: grid; gap: 0.5rem; padding: 1rem 1.1rem; border: 1px solid var(--ept-success); border-radius: 12px; background: var(--ept-success-light); }
    h2 { display: flex; align-items: center; gap: 0.45rem; margin: 0; color: var(--ept-success-dark); font-size: 1.05rem; }
    p { margin: 0; color: var(--ept-success-dark); font-size: 0.9rem; }
    .domaines { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0; padding: 0; list-style: none;
      li { padding: 0.12rem 0.55rem; border-radius: 999px; background: var(--ept-surface); color: var(--ept-success-dark); font-size: 0.78rem; font-weight: 600; } }
  `,
})
export class PartenariatOrganisme {
  private readonly service = inject(PartenairesService);
  private readonly auth = inject(AuthService);

  readonly organismeId = input.required<string>();
  protected readonly partenariat = signal<PartenariatPublic | null>(null);
  private readonly lecteur = computed(() => LECTEURS.includes(this.auth.utilisateur()?.role ?? ''));

  constructor() {
    effect((nettoyer) => {
      const id = this.organismeId();
      this.partenariat.set(null);
      if (!this.lecteur()) return;
      const abonnement = this.service.partenariat(id).subscribe({ next: (p) => this.partenariat.set(p), error: () => this.partenariat.set(null) });
      nettoyer(() => abonnement.unsubscribe());
    });
  }
}
