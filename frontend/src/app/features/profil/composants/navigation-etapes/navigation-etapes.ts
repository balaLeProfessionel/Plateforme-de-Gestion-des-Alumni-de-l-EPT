import { Component, input, output } from '@angular/core';

// Barre de navigation en bas d'une etape : une action principale et un lien
// discret. Les libelles viennent de la page, qui seule sait ou elle mene.
@Component({
  selector: 'app-navigation-etapes',
  templateUrl: './navigation-etapes.html',
  styleUrl: './navigation-etapes.scss'
})
export class NavigationEtapes {
  // null : l'etape n'a pas d'action principale ici (le bouton
  // d'enregistrement vit alors dans la section elle-meme)
  readonly libellePrincipal = input<string | null>(null);
  readonly libelleSecondaire = input.required<string>();
  readonly enCours = input(false);

  readonly principal = output<void>();
  readonly secondaire = output<void>();
}
