import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, effect, inject, input, model, output, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

export interface RubriqueAVenir {
  libelle: string;
  icone: string;
}

/** Rubrique accessible depuis le panneau, faute de place dans la barre du bas. */
export interface RubriqueMenu extends RubriqueAVenir {
  route: string;
  compteur?: number;
}

/** Panneau « Mon espace » des petits écrans : dialog modal, focus piégé, défilement de la page bloqué. */
@Component({
  selector: 'app-menu-mobile',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-mobile.html',
  styleUrl: './menu-mobile.scss',
})
export class MenuMobile {
  readonly ouvert = model(false);
  readonly lienProfil = input<string | null>(null);
  readonly liens = input<readonly RubriqueMenu[]>([]);
  readonly rubriques = input<readonly RubriqueAVenir[]>([]);
  readonly deconnexion = output();

  private readonly document = inject(DOCUMENT);
  private readonly dialogue = viewChild<ElementRef<HTMLDialogElement>>('dialogue');
  private defilementAvantMenu: { overflow: string; scrollbarGutter: string } | null = null;

  constructor() {
    effect(() => {
      if (this.ouvert()) {
        this.ouvrirDialogue();
      } else {
        this.fermerDialogue();
      }
    });

    const ecranMobile = this.document.defaultView?.matchMedia?.('(max-width: 760px)');
    if (ecranMobile) {
      const fermerSurOrdinateur = () => {
        if (!ecranMobile.matches) this.fermer();
      };
      ecranMobile.addEventListener('change', fermerSurOrdinateur);
      inject(DestroyRef).onDestroy(() => ecranMobile.removeEventListener('change', fermerSurOrdinateur));
    }
    inject(Router).events.pipe(
      filter((evenement) => evenement instanceof NavigationStart), takeUntilDestroyed()
    ).subscribe(() => this.fermer());
    inject(DestroyRef).onDestroy(() => this.fermerDialogue());
  }

  protected fermer(): void {
    this.ouvert.set(false);
    this.fermerDialogue();
  }

  protected seDeconnecter(): void {
    this.fermer();
    this.deconnexion.emit();
  }

  /** Une fermeture native (Échap, formulaire) doit aussi remettre l’état à faux. */
  protected synchroniserFermeture(): void {
    if (!this.dialogue()?.nativeElement.open) this.fermer();
  }

  protected garderFocusDansMenu(evenement: KeyboardEvent): void {
    if (evenement.key !== 'Tab') return;
    const actions = this.dialogue()?.nativeElement.querySelectorAll<HTMLElement>('a[href], button');
    if (!actions?.length) return;
    const premier = actions[0];
    const dernier = actions[actions.length - 1];
    if (evenement.shiftKey && this.document.activeElement === premier) {
      evenement.preventDefault();
      dernier.focus();
    } else if (!evenement.shiftKey && this.document.activeElement === dernier) {
      evenement.preventDefault();
      premier.focus();
    }
  }

  protected fermerSurFond(evenement: MouseEvent): void {
    const dialogue = this.dialogue()?.nativeElement;
    if (!dialogue || evenement.target !== dialogue) return;
    const cadre = dialogue.getBoundingClientRect();
    if (evenement.clientX < cadre.left || evenement.clientX > cadre.right ||
        evenement.clientY < cadre.top || evenement.clientY > cadre.bottom) {
      this.fermer();
    }
  }

  private ouvrirDialogue(): void {
    const dialogue = this.dialogue()?.nativeElement;
    if (!dialogue || dialogue.open) return;
    dialogue.showModal();
    const style = this.document.documentElement.style;
    this.defilementAvantMenu = { overflow: style.overflow, scrollbarGutter: style.scrollbarGutter };
    style.scrollbarGutter = 'stable';
    style.overflow = 'hidden';
  }

  private fermerDialogue(): void {
    const dialogue = this.dialogue()?.nativeElement;
    if (dialogue?.open) dialogue.close();
    if (this.defilementAvantMenu) {
      Object.assign(this.document.documentElement.style, this.defilementAvantMenu);
      this.defilementAvantMenu = null;
    }
  }
}
