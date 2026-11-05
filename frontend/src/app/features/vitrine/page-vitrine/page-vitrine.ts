import { ViewportScroller } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ETAPES_ADHESION } from '../contenu-vitrine';
import { ActualitesVitrine } from '../actualites-vitrine/actualites-vitrine';
import { BanniereVitrine } from '../banniere-vitrine/banniere-vitrine';
import { ChiffresVitrine } from '../chiffres-vitrine/chiffres-vitrine';
import { EnteteVitrine } from '../entete-vitrine/entete-vitrine';
import { FonctionnalitesVitrine } from '../fonctionnalites-vitrine/fonctionnalites-vitrine';
import { PiedVitrine } from '../pied-vitrine/pied-vitrine';
import { TemoignagesVitrine } from '../temoignages-vitrine/temoignages-vitrine';

/** Page publique d'accueil, montrée avant la connexion (route `/`, garde `visiteurGuard`). */
@Component({
  selector: 'app-page-vitrine',
  imports: [RouterLink, EnteteVitrine, BanniereVitrine, FonctionnalitesVitrine, ChiffresVitrine, ActualitesVitrine, TemoignagesVitrine, PiedVitrine],
  templateUrl: './page-vitrine.html',
  styleUrl: './page-vitrine.scss',
})
export class PageVitrine {
  protected readonly etapes = ETAPES_ADHESION;

  constructor() {
    // Le défilement vers une ancre ignore `scroll-margin` : on décale de la hauteur de la barre collante,
    // le temps que la page est affichée.
    const defilement = inject(ViewportScroller);
    const page = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    defilement.setOffset(() => [0, page.querySelector('.barre-principale')?.getBoundingClientRect().height ?? 0]);
    inject(DestroyRef).onDestroy(() => defilement.setOffset([0, 0]));
  }
}
