import { Component, computed, input } from '@angular/core';
import { AvatarMembre } from '../../shared/images/avatar-membre';

/** Petits mots qu’on saute pour les initiales (« Groupe de vérification » donne « GV »). */
const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'au', 'aux', 'a', 'à']);

/** Deux initiales tirées du nom d’un groupe, ou une seule s’il n’a qu’un mot ; rien sans lettre. */
export function initialesGroupe(nom: string): string {
  const mots = nom.split(/[^\p{L}\p{N}'’]+/u)
    .map((mot) => mot.replace(/^[dl]['’]/i, ''))
    .filter((mot) => /^\p{L}/u.test(mot));
  const utiles = mots.filter((mot) => !MOTS_VIDES.has(mot.toLowerCase()));
  return (utiles.length ? utiles : mots).slice(0, 2).map((mot) => mot[0].toLocaleUpperCase('fr')).join('');
}

/**
 * Photo d’un groupe, ou à défaut ses initiales dans un carré arrondi (un membre a un rond) ; l’icône des
 * groupes si le nom n’a pas de lettre. Décorative sauf si `libelle` est donné.
 */
@Component({
  selector: 'app-avatar-groupe',
  imports: [AvatarMembre],
  template: `
    @if (urlPhoto()) {
      <app-avatar-membre [urlPhoto]="urlPhoto()" [taille]="taille()" [libelle]="libelle()" />
    } @else {
      <span class="carre" aria-hidden="true">
        @if (initiales()) { {{ initiales() }} } @else { <i class="pi pi-users"></i> }
      </span>
    }
  `,
  styles: `
    :host { display: inline-flex; flex: 0 0 auto; }
    .carre {
      display: grid;
      width: var(--taille);
      height: var(--taille);
      place-items: center;
      border-radius: 30%;
      background: var(--fond-avatar-groupe, var(--ept-primary-light));
      color: var(--ept-primary);
      font-family: var(--ept-font-heading);
      font-size: calc(var(--taille) * 0.36);
      font-weight: 600;
      line-height: 1;
    }
    .carre i { font-size: calc(var(--taille) * 0.42); }
  `,
  host: { '[style.--taille]': 'taille() + "rem"' },
})
export class AvatarGroupe {
  readonly urlPhoto = input<string | null>(null);
  readonly nom = input('');
  /** Diamètre en rem. */
  readonly taille = input(2.5);
  readonly libelle = input<string | null>(null);

  protected readonly initiales = computed(() => initialesGroupe(this.nom()));
}
