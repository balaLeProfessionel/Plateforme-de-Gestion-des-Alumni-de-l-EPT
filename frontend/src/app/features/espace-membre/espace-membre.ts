import { Component, computed, inject } from '@angular/core';
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
  private readonly router = inject(Router);

  protected readonly lienProfil = computed(() => {
    const role = this.authService.utilisateur()?.role;
    if (role === 'ORGANISME') {
      return '/completer-organisme';
    }
    if (role && ['ETUDIANT', 'ALUMNI', 'PERSONNEL', 'VISITEUR'].includes(role)) {
      return '/profil';
    }
    return null;
  });

  protected seDeconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
