import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accueil',
  imports: [],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  seDeconnecter(): void {
    this.authService.logout();
    this.router.navigate(['/connexion']);
  }
}
