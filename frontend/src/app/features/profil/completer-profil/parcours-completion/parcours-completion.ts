import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { IndicateurEtapes } from '../../composants/indicateur-etapes/indicateur-etapes';

// Etape affichee tant que la route enfant n'est pas encore resolue
const ETAPE_PAR_DEFAUT = 1;

// Cadre commun aux trois etapes de la completion de profil : entete,
// indicateur de progression, et emplacement de l'etape courante.
// Le numero d'etape vient du champ data des routes enfants : ajouter une
// etape ne demande donc qu'une ligne de route.
@Component({
  selector: 'app-parcours-completion',
  imports: [RouterOutlet, IndicateurEtapes],
  templateUrl: './parcours-completion.html',
  styleUrl: './parcours-completion.scss'
})
export class ParcoursCompletion {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly etape = toSignal(
    this.router.events.pipe(
      filter((evenement) => evenement instanceof NavigationEnd),
      // startWith couvre le premier rendu, avant toute navigation ulterieure
      startWith(null),
      map(() => this.etapeCourante())
    ),
    { initialValue: this.etapeCourante() }
  );

  // Lue a la construction du composant, donc potentiellement avant que la
  // route enfant soit resolue : a ce moment firstChild peut etre absent, ou
  // present mais sans snapshot. Chaque maillon est donc optionnel, et toute
  // valeur inexploitable retombe sur la premiere etape plutot que de faire
  // echouer la construction (ecran blanc).
  private etapeCourante(): number {
    const brut = this.route.firstChild?.snapshot?.data?.['etape'];
    const etape = Number(brut);
    return Number.isInteger(etape) && etape > 0 ? etape : ETAPE_PAR_DEFAUT;
  }
}
