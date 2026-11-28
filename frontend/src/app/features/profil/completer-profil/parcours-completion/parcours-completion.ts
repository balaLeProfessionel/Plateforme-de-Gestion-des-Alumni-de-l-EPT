import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { CadreInscription } from '../../../auth/inscription/cadre-inscription/cadre-inscription';
import { IndicateurEtapes } from '../../composants/indicateur-etapes/indicateur-etapes';
import { AuthService } from '../../../../core/services/auth/auth-service';

/** État de navigation posé par la première connexion : le compte a été ouvert par l’école. */
export interface EtatArriveeParcours {
  compteDeLEcole?: boolean;
}

// Etape affichee tant que la route enfant n'est pas encore resolue
const ETAPE_PAR_DEFAUT = 1;

// Cadre commun aux trois etapes de la completion de profil : entete,
// indicateur de progression, et emplacement de l'etape courante.
// Le numero d'etape vient du champ data des routes enfants : ajouter une
// etape ne demande donc qu'une ligne de route.
@Component({
  selector: 'app-parcours-completion',
  imports: [RouterOutlet, IndicateurEtapes, CadreInscription],
  templateUrl: './parcours-completion.html',
  styleUrl: './parcours-completion.scss'
})
export class ParcoursCompletion {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Suite du parcours d'inscription : les deux premières étapes sont déjà franchies.
  // L'étape 0 (choix du mode, import du CV) correspond à « Mode de remplissage ».
  // Sur le chemin du CV, le profil est rempli d'un coup puis relu sur la page profil.
  private readonly surCv = toSignal(
    this.router.events.pipe(
      filter((evenement) => evenement instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.startsWith('/completer-profil/cv'))
    ),
    { initialValue: this.router.url.startsWith('/completer-profil/cv') }
  );
  // Compte ouvert par l’école : le membre ne l’a ni créé ni vérifié, il a défini son mot de passe à la première
  // connexion. L’état posé par celle-ci est lu à la construction et vaut pour toute l’arrivée ; pour un étudiant,
  // dont le compte est toujours créé par l’administration, le rôle suffit, même après un rechargement.
  private readonly compteDeLEcole = inject(AuthService).utilisateur()?.role === 'ETUDIANT'
    || (this.router.currentNavigation()?.extras.state as EtatArriveeParcours | undefined)?.compteDeLEcole === true;
  private readonly debut = this.compteDeLEcole
    ? ['Compte créé par l’école', 'Mot de passe défini']
    : ['Compte créé', 'Email vérifié'];
  protected readonly etapesParcours = computed(() => this.surCv()
    ? [...this.debut, 'Import du CV', 'Relecture du profil']
    : [...this.debut, 'Mode de remplissage', 'Informations', 'Formations', 'Expériences', 'Compétences']);

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
    // L'etape 0 (choix du mode de saisie, depot du CV) n'affiche pas d'indicateur
    return brut !== undefined && Number.isInteger(etape) && etape >= 0 ? etape : ETAPE_PAR_DEFAUT;
  }
}
