import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth-service';
import { EvenementService } from '../../../core/services/evenements/evenement';
import { Evenement } from '../../../core/services/models/evenement';
import { VisuelEvenement } from '../../../shared/images/visuel-evenement';

/**
 * Un événement à venir glissé dans le fil, aussi plat qu’une publication : avec son image en bandeau bas,
 * ou sans image avec la date en tuile de calendrier. « Je participe » répond directement depuis le fil.
 */
@Component({
  selector: 'app-carte-evenement-fil',
  imports: [DatePipe, RouterLink, VisuelEvenement],
  template: `
    @let e = evenement();
    <article class="carte carte-cliquable" [attr.aria-labelledby]="'titre-evenement-' + e.id">
      <p class="contexte">
        <i class="pi" [class.pi-verified]="e.officielEpt" [class.pi-calendar]="!e.officielEpt" aria-hidden="true"></i>
        Événement · {{ e.officielEpt ? 'Officiel EPT' : 'Communauté' }}
      </p>
      @if (e.urlImage) {
        <div class="bandeau"><app-visuel-evenement [urlImage]="e.urlImage" [dateDebut]="e.dateDebut" [lieu]="e.lieu"
          [officiel]="e.officielEpt" [chargementDiffere]="true" /></div>
      }
      <div class="corps">
        @if (!e.urlImage) {
          <p class="tuile" aria-hidden="true">
            <span class="mois">{{ e.dateDebut | date: 'MMM' }}</span>
            <span class="jour">{{ e.dateDebut | date: 'd' }}</span>
          </p>
        }
        <div class="texte">
          <h3 [id]="'titre-evenement-' + e.id"><a class="lien-etire" [routerLink]="['/evenements', e.id]">{{ e.titre }}</a></h3>
          <p class="info"><span class="quand">{{ e.dateDebut | date: 'EEEE d MMMM, HH:mm' }}</span>
            @if (e.lieu) { <span class="ou"> · {{ e.lieu }}</span> }</p>
        </div>
      </div>
      <div class="pied">
        @if (peutRepondre()) {
          <button type="button" class="participer" [class.inscrit]="participe()" [attr.aria-pressed]="participe()"
            [disabled]="envoi()" (click)="basculer()">
            <i class="pi" [class.pi-check]="participe()" [class.pi-plus]="!participe()" aria-hidden="true"></i>
            Je participe
          </button>
        } @else if (complet()) {
          <span class="complet">Complet</span>
        }
        @if (participants()) {
          <span class="participants"><i class="pi pi-users" aria-hidden="true"></i>
            {{ participants() }} {{ participants() > 1 ? 'participants' : 'participant' }}</span>
        }
      </div>
      @if (erreur()) { <p class="erreur" role="alert">{{ erreur() }}</p> }
    </article>
  `,
  styles: `
    :host { display: block; min-width: 0; --marge: 1.15rem; }
    p { margin: 0; }
    .carte { overflow: hidden; min-width: 0; padding-bottom: .9rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius); background: var(--ept-surface); cursor: pointer; transition: border-color .15s; }
    .carte:hover { border-color: #b7cdd8; }
    .carte:hover h3 a { text-decoration: underline; }
    .contexte { display: flex; align-items: center; gap: .45rem; padding: .9rem var(--marge) 0; color: var(--ept-text-secondary);
      font-size: .82rem; font-weight: 600; }
    .contexte i { color: var(--ept-primary); }
    .bandeau { margin: .7rem var(--marge) 0; overflow: hidden; border-radius: var(--ept-radius-sm); }
    .bandeau app-visuel-evenement { aspect-ratio: 3 / 1; }
    .corps { display: flex; align-items: center; gap: .9rem; padding: .75rem var(--marge) 0; }
    .tuile { display: grid; flex: 0 0 auto; width: 3.4rem; padding: .35rem 0; border-radius: var(--ept-radius-sm);
      background: var(--ept-primary-light); text-align: center; line-height: 1.1; }
    .mois { color: var(--ept-primary); font-size: .72rem; font-weight: 700; text-transform: uppercase; }
    .jour { color: var(--ept-primary); font-family: var(--ept-font-heading); font-size: 1.5rem; font-weight: 700; }
    .texte { min-width: 0; }
    h3 { margin: 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.12rem;
      font-weight: 600; line-height: 1.3; overflow-wrap: anywhere; }
    h3 a { color: inherit; text-decoration: none; }
    .info { margin-top: .25rem; color: var(--ept-text-secondary); font-size: .88rem; overflow-wrap: anywhere; }
    .quand { display: inline-block; }
    .quand::first-letter { text-transform: uppercase; }
    .pied { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem 1rem; padding: .8rem var(--marge) 0; font-size: .88rem; }
    .pied:empty { display: none; }
    .participer { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.5rem; padding: .4rem .9rem;
      border: 1px solid var(--ept-primary); border-radius: var(--ept-radius-sm); background: var(--ept-surface);
      color: var(--ept-primary); font: inherit; font-weight: 600; cursor: pointer; }
    .participer:hover { background: var(--ept-primary-light); }
    .participer.inscrit { background: var(--ept-primary); color: white; }
    .participer.inscrit:hover { background: var(--ept-primary-dark); }
    .participer:disabled { cursor: progress; opacity: .7; }
    .participer:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .participer i { font-size: .8rem; }
    .complet { color: var(--ept-text-secondary); font-weight: 600; }
    .participants { display: inline-flex; align-items: center; gap: .4rem; color: var(--ept-text-secondary); }
    .erreur { padding: .5rem var(--marge) 0; color: var(--ept-error-dark); font-size: .88rem; }
    @media (prefers-reduced-motion: reduce) { .carte { transition: none; } }
    @media (max-width: 560px) {
      :host { --marge: 1rem; }
      .carte { border-inline: 0; border-radius: 0; }
      h3 { font-size: 1.05rem; }
    }
  `,
})
export class CarteEvenementFil {
  readonly evenement = input.required<Evenement>();

  private readonly service = inject(EvenementService);
  private readonly utilisateur = inject(AuthService).utilisateur;
  private readonly destroyRef = inject(DestroyRef);

  /** L’état affiché suit la réponse du serveur après chaque clic. */
  private readonly etat = linkedSignal(() => this.evenement());
  protected readonly envoi = signal(false);
  protected readonly erreur = signal('');

  protected readonly participe = computed(() => this.etat().maReponse === 'PARTICIPERA');
  protected readonly participants = computed(() => this.etat().nombreParticipants ?? 0);
  protected readonly complet = computed(() => {
    const e = this.etat();
    return e.nombrePlaces !== null && e.nombreParticipants >= e.nombrePlaces && !this.participe();
  });
  protected readonly peutRepondre = computed(() => {
    const e = this.etat();
    const role = this.utilisateur()?.role;
    const dansAudience = e.audience === 'TOUS'
      || (e.audience === 'ALUMNI' && role === 'ALUMNI')
      || (e.audience === 'ETUDIANTS' && role === 'ETUDIANT');
    return e.statut === 'PUBLIE' && dansAudience && !this.complet();
  });

  protected basculer(): void {
    if (this.envoi()) return;
    const reponse = this.participe() ? 'NE_PARTICIPERA_PAS' : 'PARTICIPERA';
    this.envoi.set(true);
    this.erreur.set('');
    this.service.repondre(this.etat().id, reponse).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (evenement) => { this.etat.set(evenement); this.envoi.set(false); },
      error: (reponseHttp: HttpErrorResponse) => {
        this.envoi.set(false);
        this.erreur.set(reponseHttp.status === 409 ? 'Cet événement est complet.'
          : reponseHttp.status === 404 ? 'Les réponses ne sont plus acceptées pour cet événement.'
            : 'Votre réponse n’a pas été enregistrée. Réessayez.');
      },
    });
  }
}
