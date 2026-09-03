import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationEtapes } from '../../composants/navigation-etapes/navigation-etapes';

// Etape 2 du parcours : les formations. Le contenu arrive a l'etape suivante
// du chantier ; la navigation est deja en place pour tester le parcours.
@Component({
  selector: 'app-etape-formations',
  imports: [NavigationEtapes],
  templateUrl: './etape-formations.html',
  styleUrl: './etape-formations.scss'
})
export class EtapeFormations {
  private readonly router = inject(Router);

  protected etapeSuivante(): void {
    this.router.navigate(['/completer-profil/experiences']);
  }
}
