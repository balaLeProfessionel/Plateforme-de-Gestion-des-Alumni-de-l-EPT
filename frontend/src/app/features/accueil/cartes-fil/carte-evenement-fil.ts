import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evenement } from '../../../core/services/models/evenement';
import { VisuelEvenement } from '../../../shared/images/visuel-evenement';

/** Un événement à venir glissé dans le fil : la date en tuile de calendrier, l’essentiel et une action. */
@Component({
  selector: 'app-carte-evenement-fil',
  imports: [DatePipe, RouterLink, VisuelEvenement],
  template: `
    @let e = evenement();
    <article class="carte carte-cliquable" [class.officielle]="e.officielEpt" [attr.aria-labelledby]="'titre-evenement-' + e.id">
      <p class="contexte">
        <i class="pi" [class.pi-verified]="e.officielEpt" [class.pi-calendar]="!e.officielEpt" aria-hidden="true"></i>
        {{ e.officielEpt ? 'Événement officiel EPT' : 'Événement de la communauté' }}
      </p>
      @if (e.urlImage) {
        <div class="visuel"><app-visuel-evenement [urlImage]="e.urlImage" [dateDebut]="e.dateDebut" [lieu]="e.lieu"
          [officiel]="e.officielEpt" [chargementDiffere]="true" /></div>
      }
      <div class="corps">
        <div class="tuile" aria-hidden="true">
          <span class="mois">{{ e.dateDebut | date: 'MMM' }}</span>
          <span class="jour">{{ e.dateDebut | date: 'd' }}</span>
        </div>
        <div class="texte">
          <h3 [id]="'titre-evenement-' + e.id"><a class="lien-etire" [routerLink]="['/evenements', e.id]">{{ e.titre }}</a></h3>
          <p class="info"><i class="pi pi-clock" aria-hidden="true"></i>
            <span>{{ e.dateDebut | date: 'EEEE d MMMM, HH:mm' }}</span></p>
          @if (e.lieu) { <p class="info"><i class="pi pi-map-marker" aria-hidden="true"></i><span>{{ e.lieu }}</span></p> }
        </div>
      </div>
      <div class="pied">
        <span class="participants">
          @if (e.maReponse === 'PARTICIPERA') {
            <i class="pi pi-check-circle" aria-hidden="true"></i> Vous participez
          } @else if (participants()) {
            <i class="pi pi-users" aria-hidden="true"></i> {{ participants() }} {{ participants() > 1 ? 'participants' : 'participant' }}
          }
        </span>
        <span class="action" aria-hidden="true">Voir l’événement <i class="pi pi-arrow-right"></i></span>
      </div>
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .carte { overflow: hidden; min-width: 0; border: 1px solid var(--ept-border); border-radius: var(--ept-radius);
      background: var(--ept-surface); box-shadow: 0 1px 2px rgb(1 67 101 / 6%), 0 6px 18px -12px rgb(1 67 101 / 22%);
      cursor: pointer; transition: border-color .15s, box-shadow .15s; }
    .carte:hover { border-color: #b7cdd8; box-shadow: 0 1px 2px rgb(1 67 101 / 6%), 0 10px 24px -14px rgb(1 67 101 / 30%); }
    .carte:hover h3 a { text-decoration: underline; }
    p { margin: 0; }
    .contexte { display: flex; align-items: center; gap: .45rem; padding: .7rem 1.15rem; border-bottom: 1px solid var(--ept-border);
      color: var(--ept-text-secondary); font-size: .82rem; font-weight: 600; }
    .contexte i { color: var(--ept-primary); }
    .officielle .contexte { border-bottom-color: transparent; background: var(--ept-primary); color: white; }
    .officielle .contexte i { color: var(--ept-sky); }
    .visuel { border-bottom: 1px solid var(--ept-border); }
    .corps { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.15rem .25rem; }
    .tuile { display: grid; flex: 0 0 auto; width: 3.6rem; overflow: hidden; border: 1px solid #bfe9f4;
      border-radius: var(--ept-radius-sm); background: #effbfe; text-align: center; }
    .mois { padding: .2rem 0; background: var(--ept-primary); color: white; font-size: .72rem; font-weight: 600; text-transform: capitalize; }
    .jour { padding: .2rem 0 .3rem; color: var(--ept-primary); font-family: var(--ept-font-heading); font-size: 1.5rem; font-weight: 700; line-height: 1.1; }
    .texte { min-width: 0; }
    h3 { margin: 0 0 .4rem; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.15rem;
      font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
    h3 a { color: inherit; text-decoration: none; }
    .info { display: flex; align-items: baseline; gap: .45rem; margin-top: .2rem; color: var(--ept-text-secondary); font-size: .88rem; }
    .info span { min-width: 0; overflow-wrap: anywhere; }
    .info span::first-letter { text-transform: uppercase; }
    .info i { flex: 0 0 auto; font-size: .8rem; }
    .pied { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem 1rem;
      margin-top: .75rem; padding: .7rem 1.15rem; border-top: 1px solid var(--ept-border); font-size: .88rem; }
    .participants { display: inline-flex; align-items: center; gap: .4rem; color: var(--ept-text-secondary); }
    .participants .pi-check-circle { color: var(--ept-success); }
    .action { display: inline-flex; align-items: center; gap: .4rem; margin-left: auto; color: var(--ept-primary); font-weight: 600; }
    .action i { font-size: .75rem; transition: transform .15s; }
    .carte:hover .action i { transform: translateX(2px); }
    @media (prefers-reduced-motion: reduce) { .carte, .action i { transition: none; } }
    @media (max-width: 560px) {
      .contexte, .corps, .pied { padding-inline: .9rem; }
      .corps { gap: .8rem; }
      h3 { font-size: 1.05rem; }
    }
  `,
})
export class CarteEvenementFil {
  readonly evenement = input.required<Evenement>();
  protected readonly participants = computed(() => this.evenement().nombreParticipants ?? 0);
}
