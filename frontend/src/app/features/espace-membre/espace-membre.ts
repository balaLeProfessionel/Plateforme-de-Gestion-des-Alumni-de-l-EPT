import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';

@Component({
  selector: 'app-espace-membre',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './espace-membre.html',
  styleUrl: './espace-membre.scss',
})
export class EspaceMembre {
  protected readonly authService = inject(AuthService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  protected readonly menuPlusOuvert = signal(false);
  protected readonly barreLateraleRepliee = signal(false);
  protected readonly rubriquesAVenir = [
    { libelle: 'Mentorat', icone: 'pi-sitemap' },
    { libelle: 'Offres d’emploi', icone: 'pi-briefcase' },
    { libelle: 'Actualités', icone: 'pi-megaphone' },
    { libelle: 'Événements', icone: 'pi-calendar' },
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
  }

  protected basculerBarreLaterale(): void {
    this.barreLateraleRepliee.update((repliee) => !repliee);
  }

  protected basculerMenuPlus(): void {
    this.menuPlusOuvert.update((ouvert) => !ouvert);
  }

  protected fermerMenuPlus(): void {
    this.menuPlusOuvert.set(false);
  }

  protected seDeconnecter(): void {
    this.fermerMenuPlus();
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
