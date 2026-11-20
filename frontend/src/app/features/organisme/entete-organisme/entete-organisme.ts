import { DOCUMENT } from '@angular/common';
import { booleanAttribute, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OrganismePublic, ResumeReseauOrganisme } from '../../../core/services/models/organisme.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

/**
 * En-tête de la fiche organisme : bandeau, logo, nom, actions, puis la place de l'organisme dans le
 * réseau EPT (membres qui y travaillent ou y sont passés), qui est ce qui distingue cette fiche.
 */
@Component({
  selector: 'app-entete-organisme',
  imports: [RouterLink, AvatarMembre],
  templateUrl: './entete-organisme.html',
  styleUrl: './entete-organisme.scss',
})
export class EnteteOrganisme {
  readonly fiche = input.required<OrganismePublic>();
  readonly typeLibelle = input('Organisme');
  readonly siteWeb = input<string | null>(null);
  readonly estMaFiche = input(false, { transform: booleanAttribute });
  readonly reseau = input<ResumeReseauOrganisme | null>(null);

  protected readonly localisation = computed(() =>
    [this.fiche().adresse, this.fiche().pays].filter((partie) => !!partie).join(', '));
  protected readonly domaine = computed(() => {
    const site = this.siteWeb();
    return site ? new URL(site).hostname.replace(/^www\./, '') : null;
  });
  protected readonly phraseReseau = computed(() => {
    const reseau = this.reseau();
    if (!reseau) return '';
    const { actuels, anciens } = reseau;
    const pluriel = (nombre: number) => (nombre > 1 ? 's' : '');
    const travaillent = `${actuels} membre${pluriel(actuels)} de la communauté y ${actuels > 1 ? 'travaillent' : 'travaille'}`;
    const passes = `${anciens} y ${anciens > 1 ? 'sont passés' : 'est passé'}`;
    if (actuels > 0 && anciens > 0) return `${travaillent}, ${passes}.`;
    if (actuels > 0) return `${travaillent} aujourd’hui.`;
    return `${anciens} membre${pluriel(anciens)} de la communauté y ${anciens > 1 ? 'sont passés' : 'est passé'}.`;
  });
  /** Quelques visages au plus : la liste complète est dans la section dédiée. */
  protected readonly visages = computed(() => this.reseau()?.apercu.slice(0, 5) ?? []);
  protected readonly autres = computed(() => {
    const reseau = this.reseau();
    return reseau ? reseau.actuels + reseau.anciens - this.visages().length : 0;
  });

  /** « Voir qui » amène à la section des membres et y place le focus (lecteurs d'écran, clavier). */
  protected allerAuxMembres(): void {
    const titre = this.document.getElementById('titre-membres');
    if (!titre) return;
    const sansAnimation = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    titre.scrollIntoView({ behavior: sansAnimation ? 'auto' : 'smooth', block: 'start' });
    titre.focus({ preventScroll: true });
  }

  private readonly document = inject(DOCUMENT);
}
