import { Component, input } from '@angular/core';
import { AvatarMembre } from '../../shared/images/avatar-membre';

/** Photo d’un groupe, ou à défaut l’icône des groupes. Décorative sauf si `libelle` est donné. */
@Component({
  selector: 'app-avatar-groupe',
  imports: [AvatarMembre],
  template: `
    @if (urlPhoto()) {
      <app-avatar-membre [urlPhoto]="urlPhoto()" [taille]="taille()" [libelle]="libelle()" />
    } @else {
      <span class="icone" aria-hidden="true"><i class="pi pi-users"></i></span>
    }
  `,
  styles: `
    :host { display: inline-flex; flex: 0 0 auto; }
    .icone {
      display: grid;
      width: var(--taille);
      height: var(--taille);
      place-items: center;
      border-radius: 50%;
      background: var(--ept-primary-light);
      color: var(--ept-primary);
      font-size: calc(var(--taille) * 0.42);
    }
    .icone i { font-size: inherit; }
  `,
  host: { '[style.--taille]': 'taille() + "rem"' },
})
export class AvatarGroupe {
  readonly urlPhoto = input<string | null>(null);
  /** Diamètre en rem. */
  readonly taille = input(2.5);
  readonly libelle = input<string | null>(null);
}
