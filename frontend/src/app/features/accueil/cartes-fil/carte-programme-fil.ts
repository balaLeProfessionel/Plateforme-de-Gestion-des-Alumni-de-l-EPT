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
      <div class="entete">
        <span class="icone" aria-hidden="true"><i class="pi pi-users"></i></span>
        <div class="identite">
          <p class="contexte">Programme de mentorat</p>
          <h3 [id]="'titre-programme-' + p.id"><a class="lien-etire" [routerLink]="['/mentorat/programmes', p.id]">{{ p.titre }}</a></h3>
        </div>
      </div>
      @if (p.description) { <p class="description">{{ p.description }}</p> }
      <ul class="chiffres">
        <li><i class="pi pi-calendar" aria-hidden="true"></i> Ouvert jusqu’au {{ p.dateFin | date: 'd MMMM y' }}</li>
        @if (mentors()) {
          <li><i class="pi pi-user" aria-hidden="true"></i> {{ mentors() }} {{ mentors() > 1 ? 'mentors volontaires' : 'mentor volontaire' }}</li>
        }
      </ul>
      <div class="pied">
        @if (p.jeParticipe) {
          <span class="statut"><i class="pi pi-check-circle" aria-hidden="true"></i> Vous y êtes mentor</span>
        }
        <span class="action" aria-hidden="true">Découvrir le programme <i class="pi pi-arrow-right"></i></span>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .carte { min-width: 0; padding: 1rem 1.15rem 0; border: 1px solid var(--ept-border); border-radius: var(--ept-radius);
      background: linear-gradient(180deg, #f2f9fc 0, var(--ept-surface) 5.5rem);
      box-shadow: 0 1px 2px rgb(1 67 101 / 6%), 0 6px 18px -12px rgb(1 67 101 / 22%);
      cursor: pointer; transition: border-color .15s, box-shadow .15s; }
    .carte:hover { border-color: #b7cdd8; box-shadow: 0 1px 2px rgb(1 67 101 / 6%), 0 10px 24px -14px rgb(1 67 101 / 30%); }
    .carte:hover h3 a { text-decoration: underline; }
    p { margin: 0; }
    .entete { display: flex; align-items: center; gap: .8rem; }
    .icone { display: grid; flex: 0 0 auto; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: var(--ept-radius-sm);
      background: var(--ept-primary); color: var(--ept-sky); }
    .icone i { font-size: 1.15rem; }
    .identite { min-width: 0; }
    .contexte { color: var(--ept-text-secondary); font-size: .8rem; font-weight: 600; }
    h3 { margin: .1rem 0 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.15rem;
      font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
    h3 a { color: inherit; text-decoration: none; }
    .description { display: -webkit-box; overflow: hidden; margin-top: .75rem; color: #1d3a4b; line-height: 1.55;
      overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }
    .chiffres { display: flex; flex-wrap: wrap; gap: .4rem; margin: .8rem 0 0; padding: 0; list-style: none; }
    .chiffres li { display: inline-flex; align-items: center; gap: .4rem; padding: .3rem .7rem; border-radius: 999px;
      background: var(--ept-primary-light); color: var(--ept-primary-dark); font-size: .8rem; font-weight: 600; }
    .chiffres i { color: var(--ept-primary); font-size: .75rem; }
    .pied { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem 1rem;
      margin: .9rem -1.15rem 0; padding: .7rem 1.15rem; border-top: 1px solid var(--ept-border); font-size: .88rem; }
    .statut { display: inline-flex; align-items: center; gap: .4rem; color: var(--ept-success-dark); font-weight: 600; }
    .action { display: inline-flex; align-items: center; gap: .4rem; margin-left: auto; color: var(--ept-primary); font-weight: 600; }
    .action i { font-size: .75rem; transition: transform .15s; }
    .carte:hover .action i { transform: translateX(2px); }
    @media (prefers-reduced-motion: reduce) { .carte, .action i { transition: none; } }
    @media (max-width: 560px) {
      .carte { padding: .9rem .9rem 0; }
      .pied { margin-inline: -.9rem; padding-inline: .9rem; }
      h3 { font-size: 1.05rem; }
    }
  `,
})
export class CarteProgrammeFil {
  readonly programme = input.required<Programme>();
  protected readonly mentors = computed(() => this.programme().nombreMentors ?? 0);
}
