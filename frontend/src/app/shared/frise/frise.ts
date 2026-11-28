import { Component, input } from '@angular/core';

export type Avancement = 'fait' | 'en-cours' | 'a-venir' | 'refuse';

export interface EtapeFrise {
  titre: string;
  etat: string;
  avancement: Avancement;
}

/**
 * Frise d'avancement : étapes reliées par un trait, empilées sur mobile. Le calcul des étapes revient à l'appelant
 * (stage, mobilité) ; l'étape en cours porte aria-current="step".
 */
@Component({
  selector: 'app-frise',
  template: `
    <ol [attr.aria-label]="libelle()">
      @for (e of etapes(); track e.titre) {
        <li [attr.data-avancement]="e.avancement" [attr.aria-current]="e.avancement === 'en-cours' ? 'step' : null">
          <span class="repere" aria-hidden="true">
            @switch (e.avancement) {
              @case ('fait') { <i class="pi pi-check"></i> }
              @case ('refuse') { <i class="pi pi-times"></i> }
            }
          </span>
          <span class="texte"><strong>{{ e.titre }}</strong><span class="etat">{{ ' ' + e.etat }}</span></span>
        </li>
      }
    </ol>
  `,
  styleUrl: './frise.scss',
})
export class Frise {
  readonly etapes = input.required<EtapeFrise[]>();
  readonly libelle = input.required<string>();
}
