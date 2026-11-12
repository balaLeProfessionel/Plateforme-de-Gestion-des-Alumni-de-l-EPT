import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Ce qui compte pour la complétude : les champs du profil et le nombre d’étapes de parcours. */
export interface DonneesCompletude {
  urlPhoto: string | null;
  bio: string | null;
  posteActuel: string | null;
  villeResidence: string | null;
  lienLinkedin: string | null;
  nombreExperiences: number;
  nombreFormations: number;
}

export interface EtapeCompletude {
  libelle: string;
  fait: boolean;
  /** Section de /profil/parametres où compléter l’étape. */
  fragment: string;
}

/** Étapes d’un profil complet, de la plus utile à l’annuaire à la moins utile. */
export function etapesCompletude(d: DonneesCompletude): EtapeCompletude[] {
  const rempli = (valeur: string | null) => !!valeur?.trim();
  return [
    { libelle: 'Ajouter une photo', fait: rempli(d.urlPhoto), fragment: 'photo' },
    { libelle: 'Indiquer votre poste actuel', fait: rempli(d.posteActuel), fragment: 'informations' },
    { libelle: 'Ajouter une expérience', fait: d.nombreExperiences > 0, fragment: 'parcours' },
    { libelle: 'Ajouter une formation', fait: d.nombreFormations > 0, fragment: 'formations' },
    { libelle: 'Écrire quelques mots sur vous', fait: rempli(d.bio), fragment: 'informations' },
    { libelle: 'Indiquer votre ville', fait: rempli(d.villeResidence), fragment: 'informations' },
    { libelle: 'Ajouter votre LinkedIn', fait: rempli(d.lienLinkedin), fragment: 'informations' },
  ];
}

/** Jauge « Profil complété à n % » et liste des étapes qui restent, chacune menant au bon réglage. */
@Component({
  selector: 'app-completude-profil',
  imports: [RouterLink],
  template: `
    <section class="completude" aria-labelledby="titre-completude">
      <div class="entete">
        <h2 id="titre-completude">Complétez votre profil</h2>
        <span class="pourcentage" aria-hidden="true">{{ pourcentage() }} %</span>
      </div>
      <div class="jauge" role="progressbar" aria-labelledby="titre-completude" aria-valuemin="0" aria-valuemax="100"
        [attr.aria-valuenow]="pourcentage()" [attr.aria-valuetext]="pourcentage() + ' % complété'">
        <span [style.width.%]="pourcentage()"></span>
      </div>
      <p class="aide">Un profil complet est mieux trouvé dans l’annuaire et par les mentors.</p>
      <ul>
        @for (etape of restantes(); track etape.libelle) {
          <li><a routerLink="/profil/parametres" [fragment]="etape.fragment">
            <i class="pi pi-plus-circle" aria-hidden="true"></i>{{ etape.libelle }}</a></li>
        }
      </ul>
    </section>
  `,
  styles: `
    .completude { display: grid; gap: .6rem; padding: 1.1rem 1.2rem; border: 1px solid var(--ept-border);
      border-radius: var(--ept-radius); background: var(--ept-surface); }
    .entete { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
    h2 { margin: 0; color: var(--ept-primary-dark); font-family: var(--ept-font-heading); font-size: 1.05rem; }
    .pourcentage { color: var(--ept-primary); font-weight: 700; }
    .jauge { height: .5rem; overflow: hidden; border-radius: 999px; background: var(--ept-primary-light); }
    .jauge span { display: block; height: 100%; border-radius: inherit; background: var(--ept-primary); transition: width .3s; }
    .aide { margin: 0; color: var(--ept-text-secondary); font-size: .85rem; }
    ul { display: grid; gap: .1rem; margin: 0; padding: 0; list-style: none; }
    a { display: inline-flex; align-items: center; gap: .5rem; min-height: 2.25rem; color: var(--ept-primary);
      font-size: .9rem; font-weight: 600; text-decoration: none; }
    a:hover { text-decoration: underline; }
    a:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .jauge span { transition: none; } }
  `,
})
export class CompletudeProfil {
  readonly etapes = input.required<EtapeCompletude[]>();
  /** Nombre d’étapes restantes affichées (les plus utiles d’abord). */
  readonly maximum = input(4);

  protected readonly pourcentage = computed(() => {
    const etapes = this.etapes();
    return etapes.length ? Math.round(100 * etapes.filter((e) => e.fait).length / etapes.length) : 100;
  });
  protected readonly restantes = computed(() => this.etapes().filter((e) => !e.fait).slice(0, this.maximum()));
}
