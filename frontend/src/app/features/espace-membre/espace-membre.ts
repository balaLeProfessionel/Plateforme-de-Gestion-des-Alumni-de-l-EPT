import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnDestroy, computed, inject, linkedSignal, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar as IconeSidebar } from '@primeicons/angular/sidebar';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth/auth-service';

@Component({
  selector: 'app-espace-membre',
  imports: [AvatarModule, RouterLink, RouterLinkActive, RouterOutlet, SidebarModule, MenuModule, TooltipModule, ButtonModule, IconeSidebar],
  templateUrl: './espace-membre.html',
  styleUrl: './espace-membre.scss',
})
export class EspaceMembre implements OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly dialogueMenu = viewChild<ElementRef<HTMLDialogElement>>('dialogueMenu');
  private defilementAvantMenu: { overflow: string; scrollbarGutter: string } | null = null;
  private readonly formatNavigation = this.document.defaultView?.matchMedia?.('(max-width: 1023px)');
  private readonly changementFormatNavigation = (evenement: MediaQueryListEvent) =>
    this.sidebarOuverte.set(!evenement.matches);
  protected readonly menuOuvert = signal(false);
  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects)
  ), { initialValue: this.router.url });
  protected readonly pageDuMenu = computed(() =>
    /^\/(profil|organisme|completer-profil|completer-organisme)(\/|\?|#|$)/.test(this.urlCourante())
  );
  protected readonly sidebarOuverte = signal(!this.formatNavigation?.matches);
  protected readonly liensNavigation = [
    { libelle: 'Accueil', icone: 'pi-home', route: '/accueil', exact: true },
    { libelle: 'Annuaire', icone: 'pi-users', route: '/annuaire', exact: false },
    { libelle: 'Événements', icone: 'pi-calendar', route: '/evenements', exact: false },
  ];
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

  protected readonly elementsMenuCompte = computed<MenuItem[]>(() => {
    const profil = this.lienProfil();
    const parametres = this.lienParametres();
    const organisme = this.authService.utilisateur()?.role === 'ORGANISME';
    return [
      ...(profil ? [{ label: organisme ? 'Mon organisme' : 'Mon profil', icon: 'pi pi-user', routerLink: profil }] : []),
      ...(parametres ? [{ label: 'Paramètres', icon: 'pi pi-cog', routerLink: parametres }] : []),
      ...(profil || parametres ? [{ separator: true }] : []),
      { label: 'Déconnexion', icon: 'pi pi-sign-out', command: () => this.seDeconnecter() },
    ];
  });

  protected readonly nomAffiche = computed(() => {
    const utilisateur = this.authService.utilisateur();
    return [utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ') || 'Mon compte';
  });

  protected readonly initiales = computed(() => {
    const utilisateur = this.authService.utilisateur();
    return [utilisateur?.prenom?.[0], utilisateur?.nom?.[0]]
      .filter(Boolean).join('').toUpperCase() || 'EPT';
  });

  /** Repasse à faux à chaque nouvelle photo, pour retenter son chargement. */
  protected readonly photoInvalide = linkedSignal({
    source: () => this.authService.utilisateur()?.urlPhoto,
    computation: () => false,
  });

  protected readonly photoProfil = computed(() =>
    this.photoInvalide() ? undefined : this.authService.utilisateur()?.urlPhoto || undefined
  );

  protected readonly typeMembre = computed(() => {
    const role = this.authService.utilisateur()?.role;
    return ({ ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel',
      VISITEUR: 'Visiteur', ORGANISME: 'Organisme', ADMIN: 'Administration'
    } as Record<string, string>)[role ?? ''] ?? 'Membre';
  });

  constructor() {
    this.formatNavigation?.addEventListener('change', this.changementFormatNavigation);
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
    this.formatNavigation?.removeEventListener('change', this.changementFormatNavigation);
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

  protected seDeconnecter(): void {
    this.fermerMenu();
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
