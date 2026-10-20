import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth/auth-service';

@Component({
  selector: 'app-espace-membre',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './espace-membre.html',
  styleUrl: './espace-membre.scss',
  host: { '(window:resize)': 'fermerMenuSurGrandEcran()' },
})
export class EspaceMembre implements OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly dialogueMenu = viewChild<ElementRef<HTMLDialogElement>>('dialogueMenu');
  private defilementAvantMenu: { overflow: string; scrollbarGutter: string } | null = null;
  protected readonly menuOuvert = signal(false);
  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects)
  ), { initialValue: this.router.url });
  protected readonly pageDuMenu = computed(() =>
    /^\/(profil|organisme|completer-profil|completer-organisme)(\/|\?|#|$)/.test(this.urlCourante())
  );
  protected readonly barreLateraleRepliee = signal(false);
  protected readonly rubriquesAVenir = [
    { libelle: 'Mentorat', icone: 'pi-sitemap' },
    { libelle: 'Offres d’emploi', icone: 'pi-briefcase' },
    { libelle: 'Actualités', icone: 'pi-megaphone' },
  ];

  protected readonly lienProfil = computed(() => {
    const role = this.authService.utilisateur()?.role;
    if (role === 'ORGANISME') {
      return '/organisme/parametres';
    }
    if (role && ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'].includes(role)) {
      return '/profil';
    }
    return null;
  });

  protected readonly lienParametres = computed(() =>
    ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'].includes(
      this.authService.utilisateur()?.role ?? ''
    ) ? '/profil/parametres' : null
  );

  protected readonly nomAffiche = computed(() => {
    const utilisateur = this.authService.utilisateur();
    return [utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ') || 'Mon compte';
  });

  protected readonly initiales = computed(() => {
    const utilisateur = this.authService.utilisateur();
    return [utilisateur?.prenom?.[0], utilisateur?.nom?.[0]]
      .filter(Boolean).join('').toUpperCase() || 'EPT';
  });

  protected readonly typeMembre = computed(() => {
    const role = this.authService.utilisateur()?.role;
    return ({ ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel',
      VISITEUR: 'Visiteur', ORGANISME: 'Organisme', ADMIN: 'Administration'
    } as Record<string, string>)[role ?? ''] ?? 'Membre';
  });

  constructor() {
    this.barreLateraleRepliee.set((this.document.defaultView?.innerWidth ?? 1200) <= 1100);
    const ecranMobile = this.document.defaultView?.matchMedia?.('(max-width: 760px)');
    if (ecranMobile) {
      const fermerSurOrdinateur = () => {
        if (!ecranMobile.matches) this.fermerMenu();
      };
      ecranMobile.addEventListener('change', fermerSurOrdinateur);
      inject(DestroyRef).onDestroy(() => ecranMobile.removeEventListener('change', fermerSurOrdinateur));
    }
    this.router.events.pipe(
      filter((evenement) => evenement instanceof NavigationStart), takeUntilDestroyed()
    ).subscribe(() => this.fermerMenu());
  }

  protected basculerBarreLaterale(): void {
    this.barreLateraleRepliee.update((repliee) => !repliee);
  }

  protected basculerMenu(): void {
    const dialogue = this.dialogueMenu()?.nativeElement;
    if (!dialogue) return;
    if (dialogue.open) {
      this.fermerMenu();
    } else {
      dialogue.showModal();
      const style = this.document.documentElement.style;
      this.defilementAvantMenu = { overflow: style.overflow, scrollbarGutter: style.scrollbarGutter };
      style.scrollbarGutter = 'stable';
      style.overflow = 'hidden';
      this.menuOuvert.set(true);
    }
  }

  protected fermerMenu(): void {
    const dialogue = this.dialogueMenu()?.nativeElement;
    if (dialogue?.open) dialogue.close();
    if (this.defilementAvantMenu) {
      Object.assign(this.document.documentElement.style, this.defilementAvantMenu);
      this.defilementAvantMenu = null;
    }
    this.menuOuvert.set(false);
  }

  protected synchroniserFermetureMenu(): void {
    if (!this.dialogueMenu()?.nativeElement.open) this.fermerMenu();
  }

  protected garderFocusDansMenu(evenement: KeyboardEvent): void {
    if (evenement.key !== 'Tab') return;
    const actions = this.dialogueMenu()?.nativeElement.querySelectorAll<HTMLElement>('a[href], button');
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

  ngOnDestroy(): void {
    this.fermerMenu();
  }

  protected fermerMenuSurFond(evenement: MouseEvent): void {
    const dialogue = this.dialogueMenu()?.nativeElement;
    if (!dialogue || evenement.target !== dialogue) return;
    const cadre = dialogue.getBoundingClientRect();
    if (evenement.clientX < cadre.left || evenement.clientX > cadre.right ||
        evenement.clientY < cadre.top || evenement.clientY > cadre.bottom) {
      this.fermerMenu();
    }
  }

  protected fermerMenuSurGrandEcran(): void {
    if ((this.document.defaultView?.innerWidth ?? 1200) > 760 && this.menuOuvert()) {
      this.fermerMenu();
    }
  }

  protected seDeconnecter(): void {
    this.fermerMenu();
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
