import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_ECOLE } from '../contenu-vitrine';
import { LiensEcole } from '../liens-ecole/liens-ecole';

@Component({
  selector: 'app-pied-vitrine',
  imports: [RouterLink, LiensEcole],
  templateUrl: './pied-vitrine.html',
  styleUrl: './pied-vitrine.scss',
})
export class PiedVitrine {
  protected readonly annee = new Date().getFullYear();
  protected readonly siteEcole = SITE_ECOLE;
}
