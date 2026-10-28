import { Component, computed, input } from '@angular/core';

export interface PresentationRole {
  libelle: string;
  icone: string;
}

/** Libellé et icône du type de membre, partagés par l’annuaire et le mentorat. */
export const PRESENTATION_ROLES_MEMBRE: Record<string, PresentationRole> = {
  ALUMNI: { libelle: 'Alumni', icone: 'pi-graduation-cap' },
  ETUDIANT: { libelle: 'Étudiant', icone: 'pi-book' },
  PERSONNEL: { libelle: 'Personnel EPT', icone: 'pi-id-card' },
  VISITEUR: { libelle: 'Visiteur', icone: 'pi-user' },
};

/** Pastille « Alumni », « Étudiant »… aux couleurs du rôle, lisible sur fond blanc comme sur un bandeau. */
@Component({
  selector: 'app-etiquette-role',
  host: { '[attr.data-role]': 'role()' },
  template: `
    @if (presentation(); as role) {
      <i class="pi" [class]="'pi ' + role.icone" aria-hidden="true"></i>{{ role.libelle }}
    }
  `,
  styles: `
    :host {
      --couleur: var(--ept-primary);
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.15rem 0.5rem;
      border: 1px solid var(--ept-border);
      border-radius: 999px;
      background: white;
      color: var(--couleur);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      line-height: 1.4;
      text-transform: uppercase;
      white-space: nowrap;
    }
    :host([data-role='ETUDIANT']) { --couleur: var(--ept-gold-dark); }
    :host([data-role='PERSONNEL']) { --couleur: var(--ept-primary-dark); }
    :host([data-role='VISITEUR']) { --couleur: var(--ept-text-secondary); }
    i { font-size: 0.75rem; }
  `,
})
export class EtiquetteRole {
  readonly role = input<string | null | undefined>(null);
  protected readonly presentation = computed(() => PRESENTATION_ROLES_MEMBRE[this.role() ?? ''] ?? null);
}
