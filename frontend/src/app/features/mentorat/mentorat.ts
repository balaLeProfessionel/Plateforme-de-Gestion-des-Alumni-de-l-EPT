import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { gereLesProgrammes, participeAuMentorat } from '../../core/services/models/mentorat.model';
import { GuideMentorat } from './guide-mentorat/guide-mentorat';
import { GroupeOnglets, Onglet, Onglets } from '../../shared/onglets/onglets';

const ONGLETS_MENTORE: readonly Onglet[] = [
  { libelle: 'Trouver un mentor', lien: 'trouver', icone: 'pi-search' },
  { libelle: 'Mes mentorats', lien: 'mentorats', icone: 'pi-comments' },
];

/** Chaque membre a les deux casquettes : se faire accompagner, et accompagner à son tour. */
function groupesMentorat(demandesEnAttente: number): readonly GroupeOnglets[] {
  return [
    { titre: 'Être accompagné', onglets: ONGLETS_MENTORE },
    { titre: 'Accompagner', onglets: [
      { libelle: 'Mes mentorés', lien: 'mentores', icone: 'pi-users', compteur: demandesEnAttente },
      { libelle: 'Mon offre', lien: 'offre', icone: 'pi-sliders-h' },
    ] },
  ];
}

/** Cadre commun du mentorat : en-tête et onglets des deux rôles pour les membres participants. */
@Component({
  selector: 'app-mentorat',
  imports: [RouterLink, RouterOutlet, GuideMentorat, Onglets],
  templateUrl: './mentorat.html',
  styleUrl: './mentorat.scss',
})
export class MentoratPage {
  private readonly authService = inject(AuthService);
  protected readonly compteur = inject(CompteurDemandesMentorat);

  protected readonly role = computed(() => this.authService.utilisateur()?.role);
  protected readonly participe = computed(() => participeAuMentorat(this.role()));
  protected readonly gereProgrammes = computed(() => gereLesProgrammes(this.role()));
  protected readonly groupes = computed(() => this.participe() ? groupesMentorat(this.compteur.nombre()) : []);

  constructor() {
    if (this.participe()) this.compteur.actualiser();
  }
}
