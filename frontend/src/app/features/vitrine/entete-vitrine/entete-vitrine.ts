import { Component, ElementRef, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MENUS_ENTETE } from '../contenu-vitrine';
import { LiensEcole } from '../liens-ecole/liens-ecole';

@Component({
  selector: 'app-entete-vitrine',
  imports: [FormField, RouterLink, RouterLinkActive, LiensEcole],
  templateUrl: './entete-vitrine.html',
  styleUrls: ['./entete-vitrine.scss', './entete-vitrine-menus.scss'],
  host: {
    '(document:click)': 'fermerSiExterieur($event)',
    '(keydown.escape)': 'fermerDepuisClavier()',
    '(focusout)': 'fermerSiFocusSort($event)',
  },
})
export class EnteteVitrine {
  private readonly router = inject(Router);
  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly menus = MENUS_ENTETE;
  protected readonly menuOuvert = signal<string | null>(null);
  /** Menu des rubriques, sous le palier large : au-dessus, elles sont toujours visibles. */
  protected readonly menuMobileOuvert = signal(false);
  /** « / » ne doit pas rester actif sur toutes les pages, ni sans son ancre. */
  protected readonly correspondanceExacte: IsActiveMatchOptions = {
    paths: 'exact', queryParams: 'ignored', fragment: 'exact', matrixParams: 'ignored'
  };

  private readonly modele = signal({ recherche: '' });
  protected readonly formulaire = form(this.modele);

  protected basculer(menu: string): void {
    this.menuOuvert.update((ouvert) => (ouvert === menu ? null : menu));
  }

  protected basculerMenuMobile(): void {
    this.menuMobileOuvert.update((ouvert) => !ouvert);
    this.menuOuvert.set(null);
  }

  protected fermer(): void {
    this.menuOuvert.set(null);
    this.menuMobileOuvert.set(false);
  }

  protected fermerSiExterieur(evenement: Event): void {
    if (!this.dansLeMenu(evenement.target as Node)) this.fermer();
  }

  /** Au clavier, quitter une rubrique la referme, et quitter le menu referme tout. */
  protected fermerSiFocusSort(evenement: FocusEvent): void {
    const suivant = evenement.relatedTarget as Node | null;
    if (!suivant) return;
    const rubrique = this.hote.querySelector(`[aria-controls="menu-${this.menuOuvert()}"]`)?.closest('.rubrique');
    if (rubrique && !rubrique.contains(suivant)) this.menuOuvert.set(null);
    if (!this.dansLeMenu(suivant)) this.fermer();
  }

  /** Échap referme un niveau à la fois et rend le focus au bouton concerné, pour ne pas perdre la position. */
  protected fermerDepuisClavier(): void {
    const ouvert = this.menuOuvert();
    if (ouvert) {
      this.menuOuvert.set(null);
      this.hote.querySelector<HTMLElement>(`[aria-controls="menu-${ouvert}"]`)?.focus();
    } else if (this.menuMobileOuvert()) {
      this.menuMobileOuvert.set(false);
      this.hote.querySelector<HTMLElement>('.bouton-menu')?.focus();
    }
  }

  private dansLeMenu(noeud: Node): boolean {
    return ['.rubriques', '.bouton-menu'].some((selecteur) => this.hote.querySelector(selecteur)?.contains(noeud));
  }

  protected rechercher(evenement: Event): void {
    evenement.preventDefault();
    const recherche = this.modele().recherche.trim();
    void this.router.navigate(['/recherche'], { queryParams: recherche ? { q: recherche } : {} });
  }
}
