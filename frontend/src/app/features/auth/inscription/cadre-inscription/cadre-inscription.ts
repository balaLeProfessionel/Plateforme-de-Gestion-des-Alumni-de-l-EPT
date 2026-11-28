import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';

const ETAPES = ['Votre profil', 'Vos informations', 'Votre compte', 'Vérification de l’email'];

// Mise en page commune aux écrans d'inscription. Sur grand écran, un panneau
// aux couleurs de l'EPT montre les étapes ; sur téléphone, seul le contenu reste.
@Component({
  selector: 'app-cadre-inscription',
  imports: [NgOptimizedImage],
  templateUrl: './cadre-inscription.html',
  styleUrl: './cadre-inscription.scss',
})
export class CadreInscription {
  /** Étape en cours, de 1 à 4. */
  readonly etape = input.required<number>();

  /** Étapes affichées dans le panneau (le parcours de complétion du profil passe les siennes). */
  readonly etapes = input<readonly string[]>(ETAPES);
  readonly accroche = input('Rejoignez le réseau des diplômés de l’École Polytechnique de Thiès.');
  readonly libellePanneau = input('Progression de l’inscription');
  /** Contenu large (formulaires de parcours) : le panneau n'apparaît qu'à partir des grands écrans. */
  readonly large = input(false);
}
