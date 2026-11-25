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

  protected readonly etapes = ETAPES;
}
