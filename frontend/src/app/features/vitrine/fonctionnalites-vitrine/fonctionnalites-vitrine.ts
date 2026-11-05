import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FONCTIONNALITES } from '../contenu-vitrine';

@Component({
  selector: 'app-fonctionnalites-vitrine',
  imports: [RouterLink],
  templateUrl: './fonctionnalites-vitrine.html',
  styleUrl: './fonctionnalites-vitrine.scss',
})
export class FonctionnalitesVitrine {
  protected readonly fonctionnalites = FONCTIONNALITES;
}
