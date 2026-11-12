import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth-service';
import { EvenementService } from '../../core/services/evenements/evenement';
import { MentoratService } from '../../core/services/mentorat/mentorat';
import { participeAuMentorat } from '../../core/services/models/mentorat.model';
import { ProfilService } from '../../core/services/profil/profil-service';
import { AvatarMembre } from '../../shared/images/avatar-membre';
import { CompletudeProfil, etapesCompletude } from '../../shared/profil/completude-profil';

const NOMBRE_EVENEMENTS = 3;
const NOMBRE_MENTORS = 3;

/**
 * Colonne de droite du fil sur grand écran : ce qui arrive bientôt, qui peut m’accompagner,
 * et ce qui manque à mon profil. Chaque bloc disparaît s’il n’a rien à montrer ou si son chargement échoue.
 */
@Component({
  selector: 'app-colonne-fil',
  imports: [DatePipe, RouterLink, AvatarMembre, CompletudeProfil],
  template: `
    @if (etapes(); as etapes) { <app-completude-profil [etapes]="etapes" [maximum]="3" /> }

    @if (evenements()?.length) {
      <section class="bloc" aria-labelledby="titre-prochains">
        <h2 id="titre-prochains">Prochains événements</h2>
        <ul>
          @for (e of evenements(); track e.id) {
            <li class="evenement">
              <span class="date" aria-hidden="true"><b>{{ e.dateDebut | date:'d' }}</b>{{ e.dateDebut | date:'MMM' }}</span>
              <span class="texte">
                <a [routerLink]="['/evenements', e.id]">{{ e.titre }}</a>
                <small><time [attr.datetime]="e.dateDebut">{{ e.dateDebut | date:'EEEE d MMMM, HH:mm' }}</time></small>
              </span>
            </li>
          }
        </ul>
        <a class="tout" routerLink="/evenements">Tous les événements</a>
      </section>
    }

    @if (mentors(); as m) {
      @if (m.liste.length) {
        <section class="bloc" aria-labelledby="titre-mentors">
          <h2 id="titre-mentors">{{ m.memeFiliere ? 'Mentors de votre filière' : 'Mentors disponibles' }}</h2>
          <ul>
            @for (mentor of m.liste; track mentor.profilId) {
              <li class="mentor">
                <app-avatar-membre [urlPhoto]="mentor.urlPhoto" [nom]="mentor.nom" [prenom]="mentor.prenom"
                  [roleMembre]="mentor.role" [taille]="2.25" />
                <span class="texte">
                  <a [routerLink]="['/profil', mentor.utilisateurId]">{{ mentor.prenom }} {{ mentor.nom }}</a>
                  <small>{{ mentor.posteActuel || mentor.filiere || 'Mentor EPT' }}</small>
                </span>
              </li>
            }
          </ul>
          <a class="tout" routerLink="/mentorat/trouver">Trouver un mentor</a>
        </section>
      }
    }
  `,
  styles: `
    :host { display: grid; align-content: start; gap: 1rem; }
    .bloc { padding: 1.1rem 1.2rem; border: 1px solid var(--ept-border); border-radius: var(--ept-radius); background: var(--ept-surface); }
    h2 { margin: 0 0 .75rem; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.05rem; }
    ul { display: grid; gap: .85rem; margin: 0; padding: 0; list-style: none; }
    li { display: flex; align-items: center; gap: .75rem; min-width: 0; }
    .texte { display: grid; min-width: 0; }
    .texte a { overflow: hidden; color: var(--ept-primary-dark); font-weight: 600; text-decoration: none;
      text-overflow: ellipsis; white-space: nowrap; }
    .texte a:hover { text-decoration: underline; }
    small { overflow: hidden; color: var(--ept-text-secondary); font-size: .8rem; text-overflow: ellipsis; white-space: nowrap; }
    .date { display: grid; flex: 0 0 auto; place-items: center; width: 2.9rem; height: 3.1rem; border-radius: var(--ept-radius-sm);
      background: var(--ept-primary-light); color: var(--ept-primary); font-size: .72rem; font-weight: 600; line-height: 1.1;
      text-transform: uppercase; }
    .date b { font-size: 1.15rem; }
    .tout { display: inline-flex; align-items: center; min-height: 2.25rem; margin-top: .5rem; color: var(--ept-primary);
      font-size: .88rem; font-weight: 600; }
    a:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
  `,
})
export class ColonneFil {
  private readonly moi = inject(AuthService).utilisateur;
  private readonly profils = inject(ProfilService);
  private readonly membre = participeAuMentorat(this.moi()?.role);

  protected readonly evenements = toSignal(inject(EvenementService).lister('AVENIR', 0, undefined, NOMBRE_EVENEMENTS).pipe(
    map((page) => page.contenu), catchError(() => of([]))));

  /** Mon profil, pour la jauge et pour la filière des mentors proposés (les organismes n’en ont pas). */
  private readonly profil = toSignal(this.membre
    ? forkJoin({ profil: this.profils.obtenirProfil(), experiences: this.profils.listerExperiences(),
        formations: this.profils.listerFormations() }).pipe(catchError(() => of(null)))
    : of(null));

  protected readonly etapes = computed(() => {
    const p = this.profil();
    if (!p) return null;
    const etapes = etapesCompletude({ ...p.profil, nombreExperiences: p.experiences.length, nombreFormations: p.formations.length });
    return etapes.some((e) => !e.fait) ? etapes : null;
  });

  private readonly mentorsDisponibles = toSignal(this.membre
    ? inject(MentoratService).rechercherMentors({ recherche: '', domaine: '', disponibles: true, page: 0 }, 24).pipe(
        map((page) => page.contenu), catchError(() => of([])))
    : of([]));

  /** Les mentors de ma filière d’abord ; à défaut, d’autres mentors disponibles. Jamais moi-même. */
  protected readonly mentors = computed(() => {
    const tous = (this.mentorsDisponibles() ?? []).filter((m) => m.utilisateurId !== this.moi()?.id && m.placesRestantes > 0);
    const filiere = this.profil()?.profil.filiere;
    const memeFiliere = filiere ? tous.filter((m) => m.filiere === filiere) : [];
    return memeFiliere.length
      ? { memeFiliere: true, liste: memeFiliere.slice(0, NOMBRE_MENTORS) }
      : { memeFiliere: false, liste: tous.slice(0, NOMBRE_MENTORS) };
  });
}
