import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { IndicateurEtapes } from '../../composants/indicateur-etapes/indicateur-etapes';

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

  private etapeCourante(): number {
    const donnees = this.route.firstChild?.snapshot.data;
    return Number(donnees?.['etape'] ?? 1);
  }
}
