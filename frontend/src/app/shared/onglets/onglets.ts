import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { Params, RouterLink, RouterLinkActive } from '@angular/router';

export interface Onglet {
  libelle: string;
  /** Lien de la vue ; relatif à la page qui affiche les onglets s’il ne commence pas par « / ». */
  lien: string;
  parametres?: Params;
  icone?: string;
  /** Pastille de nombre (demandes en attente…), masquée à zéro. */
  compteur?: number;
  libelleCompteur?: string;
  /**
   * Onglet courant quand la vue dépend des paramètres de l’URL (« ?vue=mes »).
   * Sans cette valeur, l’onglet est courant quand son lien est actif.
   */
  actif?: boolean;
}

export interface GroupeOnglets {
  titre?: string;
  onglets: readonly Onglet[];
}

/**
 * Onglets de navigation entre les vues d’une rubrique : soulignement de l’onglet courant,
 * icône et compteur facultatifs, groupes titrés (mentorat). Sur mobile, les onglets d’un groupe
 * se partagent la largeur à parts égales.
 */
@Component({
  selector: 'app-onglets',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav [attr.aria-label]="libelle()">
      @for (groupe of tousLesGroupes(); track $index) {
        <div class="groupe" [attr.role]="groupe.titre ? 'group' : null" [attr.aria-labelledby]="groupe.titre ? idGroupe($index) : null">
          @if (groupe.titre) { <span class="titre-groupe" [id]="idGroupe($index)">{{ groupe.titre }}</span> }
          <div class="liens">
            @for (onglet of groupe.onglets; track onglet.libelle) {
              @if (onglet.actif === undefined) {
                <a [routerLink]="onglet.lien" [queryParams]="onglet.parametres" routerLinkActive="actif" ariaCurrentWhenActive="page">
                  <ng-container [ngTemplateOutlet]="contenu" [ngTemplateOutletContext]="{ $implicit: onglet }" />
                </a>
              } @else {
                <a [routerLink]="onglet.lien" [queryParams]="onglet.parametres" [queryParamsHandling]="fusionner() ? 'merge' : null"
                  [class.actif]="onglet.actif" [attr.aria-current]="onglet.actif ? 'page' : null">
                  <ng-container [ngTemplateOutlet]="contenu" [ngTemplateOutletContext]="{ $implicit: onglet }" />
                </a>
              }
            }
          </div>
        </div>
      }
    </nav>
    <ng-template #contenu let-onglet>
      @if (onglet.icone) { <i class="pi" [class]="'pi ' + onglet.icone" aria-hidden="true"></i> }
      <span class="libelle">{{ onglet.libelle }}</span>
      @if (onglet.compteur) {
        <!-- L’espace sépare le libellé du nombre pour les lecteurs d’écran : « Mes mentorés 3 en attente ». -->
        <span class="cache">{{ ' ' }}</span><span class="compteur">{{ onglet.compteur }}<span class="cache"> {{ onglet.libelleCompteur ?? 'en attente' }}</span></span>
      }
    </ng-template>
  `,
  styles: `
    :host { display: block; margin-bottom: 1.25rem; }
    nav { display: flex; flex-wrap: wrap; align-items: end; gap: .5rem 2rem; border-bottom: 1px solid var(--ept-border); }
    .groupe { display: grid; gap: .15rem; min-width: 0; }
    .titre-groupe { padding-inline: .9rem; color: var(--ept-text-secondary); font-size: .75rem; font-weight: 600; }
    .liens { display: flex; gap: .25rem; min-width: 0; }
    a { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.75rem; margin-bottom: -1px;
      padding: .5rem .9rem; border-bottom: 3px solid transparent; color: var(--ept-text-secondary); font-size: .92rem;
      font-weight: 600; text-decoration: none; white-space: nowrap; }
    a:hover { color: var(--ept-primary-dark); }
    a.actif { border-bottom-color: var(--ept-primary); color: var(--ept-primary-dark); }
    a:focus-visible { outline: 2px solid var(--ept-sky); outline-offset: -2px; border-radius: var(--ept-radius-sm) var(--ept-radius-sm) 0 0; }
    i { font-size: .95rem; }
    .compteur { display: inline-grid; place-items: center; min-width: 1.35rem; height: 1.35rem; padding-inline: .35rem;
      border-radius: 999px; background: var(--ept-primary); color: white; font-size: .72rem; font-weight: 700; }
    .cache { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    @media (max-width: 560px) {
      nav { display: grid; gap: .75rem; }
      .liens a { flex: 1 1 0; min-width: 0; padding-inline: .35rem; font-size: .85rem; }
      .libelle { overflow: hidden; text-overflow: ellipsis; }
      // Avec des icônes, l’icône passe au-dessus du libellé pour garder des onglets lisibles.
      .liens a:has(i) { flex-direction: column; gap: .15rem; padding-block: .4rem; font-size: .78rem; }
      .titre-groupe { padding-inline: .35rem; }
    }
  `,
})
export class Onglets {
  /** Nom de la navigation pour les lecteurs d’écran : « Vues des articles »… */
  readonly libelle = input.required<string>();
  readonly onglets = input<readonly Onglet[]>([]);
  readonly groupes = input<readonly GroupeOnglets[]>([]);
  /** Garde les autres paramètres de l’URL (filtres, recherche) en changeant de vue. */
  readonly fusionner = input(false);

  protected readonly tousLesGroupes = computed(() =>
    this.groupes().length ? this.groupes() : [{ onglets: this.onglets() }]);

  private static compteurInstances = 0;
  private readonly instance = ++Onglets.compteurInstances;
  protected idGroupe(index: number): string {
    return `onglets-${this.instance}-${index}`;
  }
}
