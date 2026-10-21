import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, computed, inject, linkedSignal, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Sidebar as IconeSidebar } from '@primeicons/angular/sidebar';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { MenuMobile, RubriqueAVenir, RubriqueMenu } from './menu-mobile/menu-mobile';
import { NavigationMobile } from './navigation-mobile/navigation-mobile';

@Component({
  selector: 'app-espace-membre',
  imports: [
    AvatarModule, RouterLink, RouterLinkActive, RouterOutlet, SidebarModule, MenuModule, TooltipModule, ButtonModule,
    IconeSidebar, MenuMobile, NavigationMobile,
  ],
  templateUrl: './espace-membre.html',
  styleUrl: './espace-membre.scss',
})
export class EspaceMembre implements OnDestroy {
  protected readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly formatNavigation = this.document.defaultView?.matchMedia?.('(max-width: 1023px)');
  private readonly changementFormatNavigation = (evenement: MediaQueryListEvent) =>
    this.sidebarOuverte.set(!evenement.matches);
  /** Partagé par le bouton du compte, la barre du bas et le dialog « Mon espace ». */
  protected readonly menuOuvert = signal(false);
  protected readonly sidebarOuverte = signal(!this.formatNavigation?.matches);
  protected readonly compteurMentorat = inject(CompteurDemandesMentorat);
  protected readonly liensNavigation = [
    { libelle: 'Accueil', icone: 'pi-home', route: '/accueil', exact: true },
    { libelle: 'Annuaire', icone: 'pi-users', route: '/annuaire', exact: false },
    { libelle: 'Événements', icone: 'pi-calendar', route: '/evenements', exact: false },
    { libelle: 'Mentorat', icone: 'pi-sitemap', route: '/mentorat', exact: false },
  ];
  protected readonly rubriquesAVenir: readonly RubriqueAVenir[] = [
    { libelle: 'Offres d’emploi', icone: 'pi-briefcase' },
    { libelle: 'Actualités', icone: 'pi-megaphone' },
  ];
  /** La barre du bas garde quatre entrées lisibles : le mentorat passe par le panneau « Menu ». */
  protected readonly liensMenuMobile = computed<readonly RubriqueMenu[]>(() => [
    { libelle: 'Mentorat', icone: 'pi-sitemap', route: '/mentorat', compteur: this.compteurMentorat.nombre() },
  ]);

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
    if (this.authService.utilisateur()?.role === 'ALUMNI') this.compteurMentorat.actualiser();
  }

  ngOnDestroy(): void {
    this.formatNavigation?.removeEventListener('change', this.changementFormatNavigation);
  }

  protected basculerMenu(): void {
    this.menuOuvert.update((ouvert) => !ouvert);
  }

  protected seDeconnecter(): void {
    this.menuOuvert.set(false);
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
