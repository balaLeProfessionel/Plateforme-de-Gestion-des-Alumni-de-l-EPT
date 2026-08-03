import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth/auth-service';

@Component({
  selector: 'app-accueil',
  imports: [],
  templateUrl: './accueil.html',
  styleUrl: './accueil.scss',
})
export class Accueil {
  protected readonly authService = inject(AuthService);
}
