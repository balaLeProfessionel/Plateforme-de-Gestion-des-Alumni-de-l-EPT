import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth-service';

@Component({
  selector: 'app-accueil',
  imports: [],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil {
  protected readonly authService = inject(AuthService);
  protected readonly typeMembre = computed(() => ({
    ETUDIANT: 'Étudiant',
    ALUMNI: 'Alumni',
    PERSONNEL: 'Personnel',
    VISITEUR: 'Visiteur',
    ORGANISME: 'Organisme',
    ADMIN: 'Administrateur'
  } as Record<string, string>)[this.authService.utilisateur()?.role ?? ''] ?? 'Membre');
}
