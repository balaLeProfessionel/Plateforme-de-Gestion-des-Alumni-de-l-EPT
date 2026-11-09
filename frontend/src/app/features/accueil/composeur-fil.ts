import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { AvatarMembre } from '../../shared/images/avatar-membre';

/**
 * Point de départ de tout ce qu’on peut partager : le faux champ mène à une publication,
 * les raccourcis dessous à un article de fond ou à un événement.
 */
@Component({
  selector: 'app-composeur-fil',
  imports: [RouterLink, AvatarMembre],
  template: `
    @let m = moi();
    <a class="invitation" routerLink="/publications/nouvelle">
      <app-avatar-membre [urlPhoto]="m?.urlPhoto" [nom]="m?.nom" [prenom]="m?.prenom" [roleMembre]="m?.role" [taille]="2.75" />
      <span class="champ"><span class="cache">Créer une publication : </span>{{ invitation() }}</span>
    </a>
    <nav class="raccourcis" aria-label="Que voulez-vous partager ?">
      <a routerLink="/publications/nouvelle"><i class="pi pi-comment publication" aria-hidden="true"></i>Publication</a>
      <a routerLink="/articles/nouveau"><i class="pi pi-book article" aria-hidden="true"></i>Article</a>
      <a routerLink="/evenements/creer"><i class="pi pi-calendar-plus evenement" aria-hidden="true"></i>Événement</a>
    </nav>
  `,
  styles: `
    :host { display: block; margin-bottom: .9rem; border: 1px solid var(--ept-border); border-radius: var(--ept-radius);
      background: var(--ept-surface); }
    .invitation { display: flex; align-items: center; gap: .75rem; padding: .85rem 1rem .6rem; color: inherit; text-decoration: none; }
    .invitation:hover .champ { background: var(--ept-primary-light); }
    .champ { flex: 1 1 auto; min-width: 0; overflow: hidden; padding: .7rem 1rem; border: 1px solid var(--ept-border);
      border-radius: 999px; background: var(--ept-bg); color: var(--ept-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
    .raccourcis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .25rem; padding: .25rem .5rem .5rem; }
    .raccourcis a { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; min-height: 2.75rem;
      border-radius: var(--ept-radius-sm); color: var(--ept-primary-dark); font-size: .9rem; font-weight: 600; text-decoration: none; }
    .raccourcis a:hover { background: var(--ept-bg); }
    .raccourcis i { font-size: 1.05rem; }
    .publication { color: var(--ept-primary); }
    .article { color: #4a4785; }
    .evenement { color: var(--ept-success-dark); }
    a:focus-visible { outline: 3px solid var(--ept-sky); outline-offset: 2px; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (max-width: 560px) {
      :host { margin-inline: -1rem; border-inline: 0; border-radius: 0; }
      .invitation { padding: .7rem 1rem .5rem; gap: .6rem; }
      .raccourcis { padding-inline: .25rem; }
      .raccourcis a { font-size: .85rem; gap: .4rem; }
    }
  `,
})
export class ComposeurFil {
  protected readonly moi = inject(AuthService).utilisateur;
  protected readonly invitation = computed(() =>
    this.moi()?.prenom ? `Quoi de neuf, ${this.moi()?.prenom} ?` : 'Partager une actualité avec la communauté');
}
