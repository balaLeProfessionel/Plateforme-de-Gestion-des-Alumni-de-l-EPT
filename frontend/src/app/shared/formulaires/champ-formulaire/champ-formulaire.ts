import { Component, ViewEncapsulation, input } from '@angular/core';

/**
 * Champ de saisie « moderne » (style A) : icone a gauche, libelle dans le cadre
 * au-dessus de la valeur, message d'erreur ou d'aide en dessous.
 *
 * Le champ lui-meme (input ou select) est projete : il garde son [formField] et
 * son id, qui doit valoir `pour`. Pour relier le message, poser sur le champ :
 * [attr.aria-describedby]="champ.idMessage" (voir l'utilisation dans l'inscription).
 *
 * Un bouton place apres le champ avec l'attribut `suffixe` (afficher le mot de
 * passe…) se range a droite du cadre.
 */
@Component({
  selector: 'app-champ-formulaire',
  exportAs: 'champ',
  templateUrl: './champ-formulaire.html',
  styleUrl: './champ-formulaire.scss',
  // Les styles visent l'element projete (input, select) : ils doivent sortir du composant
  encapsulation: ViewEncapsulation.None,
  host: { class: 'champ-formulaire' }
})
export class ChampFormulaire {
  /** Id du champ projete : relie le libelle et le message. */
  readonly pour = input.required<string>();
  readonly libelle = input.required<string>();
  /** Classe PrimeIcons, par exemple « pi-envelope ». */
  readonly icone = input<string | null>(null);
  readonly obligatoire = input(false);
  readonly erreur = input<string | null>(null);
  readonly aide = input<string | null>(null);
  /** Affiche une coche verte : valeur saisie et correcte. */
  readonly valide = input(false);

  get idMessage(): string | null {
    return this.erreur() || this.aide() ? `${this.pour()}-message` : null;
  }
}
