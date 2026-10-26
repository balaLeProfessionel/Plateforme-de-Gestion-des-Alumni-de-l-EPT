import { DOCUMENT } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { Sidebar as IconeSidebar } from '@primeicons/angular/sidebar';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurInscriptions } from '../../core/services/admin/compteur-inscriptions';
import { PermissionAdmin, TOUTES_LES_PERMISSIONS } from '../../core/services/models/admin.model';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { participeAuMentorat } from '../../core/services/models/mentorat.model';
import { AvatarMembre } from '../../shared/images/avatar-membre';
import { MenuMobile, RubriqueAVenir, RubriqueMenu } from './menu-mobile/menu-mobile';
import { NavigationMobile } from './navigation-mobile/navigation-mobile';

interface LienNavigation extends RubriqueMenu {
  exact: boolean;
}

interface GroupeNavigation {
  titre: string;
  liens: readonly LienNavigation[];
}

@Component({
  selector: 'app-espace-membre',
  imports: [
    AvatarMembre, RouterLink, RouterLinkActive, RouterOutlet, SidebarModule, MenuModule, TooltipModule, ButtonModule,
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
  private readonly compteurInscriptions = inject(CompteurInscriptions);
  /** Un compte d’administration navigue par domaine ; un membre garde les rubriques de la communauté. */
  private readonly administration = computed(() =>
    TOUTES_LES_PERMISSIONS.some((permission) => this.authService.aPermission(permission)));
  protected readonly groupesNavigation = computed<readonly GroupeNavigation[]>(() => {
    if (!this.administration()) {
      return [{ titre: 'Navigation', liens: [
        { libelle: 'Accueil', icone: 'pi-home', route: '/accueil', exact: true },
        { libelle: 'Annuaire', icone: 'pi-users', route: '/annuaire', exact: false },
        { libelle: 'Événements', icone: 'pi-calendar', route: '/evenements', exact: false },
        {
          libelle: 'Mentorat', icone: 'pi-sitemap', route: '/mentorat', exact: false,
          compteur: this.compteurMentorat.nombre(), libelleCompteur: 'demandes en attente',
        },
      ] }];
    }
    const peut = (permission: PermissionAdmin) => this.authService.aPermission(permission);
    const groupes: GroupeNavigation[] = [
      { titre: 'Pilotage', liens: peut('CONSULTER_TABLEAU_DE_BORD')
        ? [{ libelle: 'Tableau de bord', icone: 'pi-th-large', route: '/admin', exact: true }] : [] },
      { titre: 'Membres', liens: peut('GERER_COMPTES') ? [
        {
          libelle: 'Inscriptions', icone: 'pi-user-plus', route: '/admin/inscriptions', exact: false,
          compteur: this.compteurInscriptions.nombre(), libelleCompteur: 'inscriptions à examiner',
        },
        { libelle: 'Comptes', icone: 'pi-users', route: '/admin/comptes', exact: false },
        { libelle: 'Diplômés', icone: 'pi-graduation-cap', route: '/admin/diplomes', exact: false },
      ] : [] },
      { titre: 'Contenus', liens: [
        { libelle: 'Événements', icone: 'pi-calendar', route: '/evenements', exact: false },
        { libelle: 'Programmes de mentorat', icone: 'pi-sitemap', route: '/mentorat/gestion-programmes', exact: false },
      ] },
      { titre: 'Système', liens: peut('CONSULTER_JOURNAL')
        ? [{ libelle: 'Journal', icone: 'pi-history', route: '/admin/journal', exact: false }] : [] },
      { titre: 'Plateforme', liens: [{ libelle: 'Annuaire', icone: 'pi-book', route: '/annuaire', exact: false }] },
    ];
    return groupes.filter((groupe) => groupe.liens.length > 0);
  });
  protected readonly rubriquesAVenir = computed<readonly RubriqueAVenir[]>(() => this.administration() ? [
    { libelle: 'Statistiques', icone: 'pi-chart-bar' },
    { libelle: 'Modération', icone: 'pi-flag' },
    { libelle: 'Annonces', icone: 'pi-megaphone' },
    { libelle: 'Enquêtes', icone: 'pi-clipboard' },
    { libelle: 'Rôles et accès', icone: 'pi-key' },
  ] : [
    { libelle: 'Offres d’emploi', icone: 'pi-briefcase' },
    { libelle: 'Actualités', icone: 'pi-megaphone' },
  ]);
  /**
   * La barre du bas garde quatre entrées (Accueil, Annuaire, Événements, Menu) : le reste passe par le panneau
   * « Menu » — le mentorat pour un membre, les rubriques d’administration pour l’administration.
   */
  protected readonly liensMenuMobile = computed<readonly RubriqueMenu[]>(() => this.administration()
    ? this.groupesNavigation()
      .flatMap((groupe) => groupe.liens)
      .filter((lien) => !['/annuaire', '/evenements'].includes(lien.route))
    : [{ libelle: 'Mentorat', icone: 'pi-sitemap', route: '/mentorat', compteur: this.compteurMentorat.nombre() }]);

  private readonly urlCourante = toSignal(this.router.events.pipe(
    filter((evenement): evenement is NavigationEnd => evenement instanceof NavigationEnd),
    map((evenement) => evenement.urlAfterRedirects)
  ), { initialValue: this.router.url });
  /** Son propre profil n’a pas d’entrée dans la barre : le bouton du compte, qui y mène, est alors la page courante. */
  protected readonly pageCompte = computed(() =>
    /^\/(profil|profil\/parametres|organisme\/parametres)(\?|#|$)/.test(this.urlCourante()));

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

  protected readonly elementsMenuCompte = computed<MenuItem[]>(() => {
    // Pas d’entrée « Paramètres » : le profil s’ouvre en lecture et « Modifier mon profil » y mène.
    const profil = this.lienProfil();
    const organisme = this.authService.utilisateur()?.role === 'ORGANISME';
    return [
      ...(profil ? [{ label: organisme ? 'Mon organisme' : 'Mon profil', icon: 'pi pi-user', routerLink: profil }] : []),
      ...(profil ? [{ separator: true }] : []),
      { label: 'Déconnexion', icon: 'pi pi-sign-out', command: () => this.seDeconnecter() },
    ];
  });

  protected readonly nomAffiche = computed(() => {
    const utilisateur = this.authService.utilisateur();
    return [utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ') || 'Mon compte';
  });


  protected readonly typeMembre = computed(() => {
    const role = this.authService.utilisateur()?.role;
    return ({ ETUDIANT: 'Étudiant', ALUMNI: 'Alumni', PERSONNEL: 'Personnel',
      VISITEUR: 'Visiteur', ORGANISME: 'Organisme', ADMIN: 'Administration'
    } as Record<string, string>)[role ?? ''] ?? 'Membre';
  });

  constructor() {
    this.formatNavigation?.addEventListener('change', this.changementFormatNavigation);
    // Statut, rôle et permissions ont pu changer depuis la connexion (inscription validée, par exemple).
    this.authService.resynchroniser();
    if (participeAuMentorat(this.authService.utilisateur()?.role)) this.compteurMentorat.actualiser();
    if (this.authService.aPermission('GERER_COMPTES')) this.compteurInscriptions.actualiser();
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
