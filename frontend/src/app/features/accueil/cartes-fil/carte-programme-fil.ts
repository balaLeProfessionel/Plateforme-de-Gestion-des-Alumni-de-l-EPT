import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Programme } from '../../../core/services/models/mentorat.model';

/** Un programme de mentorat ouvert glissé dans le fil : son objet, ses chiffres et une invitation à le découvrir. */
@Component({
  selector: 'app-carte-programme-fil',
  imports: [DatePipe, RouterLink],
  template: `
    @let p = programme();
    <article class="carte carte-cliquable" [attr.aria-labelledby]="'titre-programme-' + p.id">
      <p class="contexte"><i class="pi pi-users" aria-hidden="true"></i> Programme de mentorat</p>
      <h3 [id]="'titre-programme-' + p.id"><a class="lien-etire" [routerLink]="['/mentorat/programmes', p.id]">{{ p.titre }}</a></h3>
      @if (p.description) { <p class="description">{{ p.description }}</p> }
      <p class="info"><i class="pi pi-hourglass" aria-hidden="true"></i>
        <span>Ouvert jusqu’au {{ p.dateFin | date: 'd MMMM' }}
          @if (mentors()) { · {{ mentors() }} {{ mentors() > 1 ? 'mentors disponibles' : 'mentor disponible' }} }</span></p>
      <p class="pied">
        @if (p.jeParticipe) {
          <span class="statut"><i class="pi pi-check-circle" aria-hidden="true"></i> Vous y êtes mentor</span>
        }
        <span class="action" aria-hidden="true">Découvrir le programme <i class="pi pi-arrow-right"></i></span>
      </p>
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; --marge: 1.15rem; }
    p { margin: 0; }
    .carte { min-width: 0; padding: .9rem var(--marge); border: 1px solid var(--ept-border); border-radius: var(--ept-radius);
      background: var(--ept-surface); cursor: pointer; transition: border-color .15s; }
    .carte:hover { border-color: #b7cdd8; }
    .carte:hover h3 a { text-decoration: underline; }
    .contexte { display: flex; align-items: center; gap: .45rem; color: var(--ept-text-secondary); font-size: .82rem; font-weight: 600; }
    .contexte i { color: var(--ept-primary); font-size: .95rem; }
    h3 { margin: .55rem 0 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.2rem;
      font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
    h3 a { color: inherit; text-decoration: none; }
    .description { display: -webkit-box; overflow: hidden; margin-top: .4rem; color: var(--ept-text-secondary); line-height: 1.55;
      overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
    .info { display: flex; align-items: center; gap: .55rem; margin-top: .75rem; padding: .6rem .8rem; border-radius: var(--ept-radius-sm);
      background: var(--ept-primary-light); color: var(--ept-text-secondary); font-size: .88rem; }
    .info i { flex: 0 0 auto; color: var(--ept-primary); font-size: .9rem; }
    .info span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pied { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; margin-top: .9rem; font-size: .95rem; }
    .statut { display: inline-flex; align-items: center; gap: .4rem; color: var(--ept-success-dark); font-weight: 600; }
    .action { display: inline-flex; align-items: center; gap: .4rem; color: var(--ept-primary); font-weight: 600; }
    .action i { font-size: .75rem; transition: transform .15s; }
    .carte:hover .action i { transform: translateX(2px); }
    @media (prefers-reduced-motion: reduce) { .carte, .action i { transition: none; } }
    @media (max-width: 560px) {
      :host { --marge: 1rem; }
      .carte { border-inline: 0; border-radius: 0; }
      h3 { font-size: 1.05rem; }
    }
  `,
})
export class CarteProgrammeFil {
  readonly programme = input.required<Programme>();
  protected readonly mentors = computed(() => this.programme().nombreMentors ?? 0);
}
