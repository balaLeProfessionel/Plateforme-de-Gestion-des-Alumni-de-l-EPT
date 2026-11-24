import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConversationDetail, ICONES_CATEGORIE, NATURES_COMMUNAUTE } from '../../../core/services/models/messagerie.model';

/**
 * En tête du fil d’une communauté où personne n’a encore écrit : ce qu’elle est, pourquoi j’en fais partie,
 * et une invitation à se présenter. C’est ce qui la distingue d’un groupe privé, choisi par ses membres.
 */
@Component({
  selector: 'app-accueil-communaute',
  imports: [RouterLink],
  template: `
    @if (communaute(); as c) {
      <div class="accueil">
        <span class="icone" aria-hidden="true"><i class="pi" [class]="c.icone"></i></span>
        <p class="nature">{{ c.nature }}</p>
        <h3>Bienvenue dans {{ c.nom }}</h3>
        @if (c.description) { <p class="description">{{ c.description }}</p> }
        <p class="entree"><i class="pi pi-info-circle" aria-hidden="true"></i>{{ c.entree }}</p>
        <p class="invitation">Personne n’a encore écrit&nbsp;: présentez-vous en quelques mots.</p>
        <a class="annuaire" [routerLink]="['/messagerie', c.id, 'membres']">
          <i class="pi pi-users" aria-hidden="true"></i>Voir l’annuaire ({{ c.membres }})
        </a>
      </div>
    }
  `,
  styles: `
    .accueil {
      display: grid;
      justify-items: center;
      gap: 0.45rem;
      max-width: 26rem;
      margin: 1.5rem auto 1rem;
      padding: 1.5rem 1.25rem;
      border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius-sm);
      background: var(--ept-surface);
      text-align: center;
    }
    .icone {
      display: grid;
      width: 3.5rem;
      height: 3.5rem;
      margin-bottom: 0.25rem;
      place-items: center;
      border-radius: 30%;
      background: var(--ept-primary-light);
      color: var(--ept-primary);

      i { font-size: 1.5rem; }
    }
    .nature {
      margin: 0;
      color: var(--ept-text-secondary);
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    h3 {
      margin: 0;
      color: var(--ept-primary-dark);
      font-family: var(--ept-font-heading);
      font-size: 1.1rem;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    p { margin: 0; line-height: 1.5; }
    .description { color: var(--ept-text); font-size: 0.9rem; }
    .entree {
      display: flex;
      align-items: baseline;
      gap: 0.4rem;
      margin-top: 0.35rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--ept-radius-sm);
      background: var(--ept-primary-light);
      color: var(--ept-primary);
      font-size: 0.84rem;
      text-align: left;

      i { flex: 0 0 auto; font-size: 0.85rem; }
    }
    .invitation { color: var(--ept-text-secondary); font-size: 0.84rem; }
    .annuaire {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      min-height: 2.5rem;
      margin-top: 0.25rem;
      padding: 0 1rem;
      border: 1px solid var(--ept-primary);
      border-radius: 999px;
      color: var(--ept-primary);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;

      &:hover { background: var(--ept-primary-light); }
      &:focus-visible { outline: 2px solid var(--ept-focus-clair); outline-offset: 2px; }
    }
  `,
})
export class AccueilCommunaute {
  readonly detail = input.required<ConversationDetail>();

  protected readonly communaute = computed(() => {
    const detail = this.detail();
    const categorie = detail.categorie;
    if (!categorie) return null;
    const nombre = detail.participants.length;
    return {
      id: detail.id,
      nom: detail.nom,
      description: detail.description,
      icone: ICONES_CATEGORIE[categorie],
      nature: NATURES_COMMUNAUTE[categorie],
      entree: modeEntree(detail),
      membres: `${nombre} membre${nombre > 1 ? 's' : ''}`,
    };
  });
}

/** Pourquoi je suis là : par mon profil pour une promo ou une filière, par choix pour les autres. */
export function modeEntree(detail: Pick<ConversationDetail, 'categorie' | 'acces'>): string {
  switch (detail.categorie) {
    case 'PROMO':
      return 'Vous en faites partie par votre promo, renseignée dans votre profil. Toute votre promo s’y retrouve.';
    case 'FILIERE':
      return 'Vous en faites partie par votre filière, renseignée dans votre profil. Toute votre filière s’y retrouve.';
    case 'PROMO_FILIERE':
      return 'Vous en faites partie par votre promo et votre filière, renseignées dans votre profil.';
    default:
      return detail.acces === 'SUR_DEMANDE'
        ? 'Communauté sur demande : chaque membre y a été accepté.'
        : 'Communauté ouverte : chaque membre l’a rejointe depuis « À découvrir ». Vous pouvez la quitter à tout moment.';
  }
}
