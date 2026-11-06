import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';
import { CHIFFRES_CLES } from '../contenu-vitrine';

@Component({
  selector: 'app-chiffres-vitrine',
  imports: [DecimalPipe],
  templateUrl: './chiffres-vitrine.html',
  styleUrl: './chiffres-vitrine.scss',
})
export class ChiffresVitrine {
  protected readonly chiffres = CHIFFRES_CLES;
}
