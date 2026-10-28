import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { gereLesProgrammes, participeAuMentorat } from '../../core/services/models/mentorat.model';
import { GuideMentorat } from './guide-mentorat/guide-mentorat';
import { FilAriane } from '../../shared/fil-ariane/fil-ariane';

interface Onglet {
  libelle: string;
  lien: string;
  icone: string;
  compteur?: boolean;
}

interface GroupeOnglets {
  id: string;
  titre: string;
  onglets: readonly Onglet[];
}

const ONGLETS_MENTORE: readonly Onglet[] = [
  { libelle: 'Trouver un mentor', lien: 'trouver', icone: 'pi-search' },
  { libelle: 'Mes mentorats', lien: 'mentorats', icone: 'pi-comments' },
];

const ONGLETS_MENTOR: readonly Onglet[] = [
  { libelle: 'Mes mentorés', lien: 'mentores', icone: 'pi-users', compteur: true },
  { libelle: 'Mon offre', lien: 'offre', icone: 'pi-sliders-h' },
];

/** Chaque membre a les deux casquettes : se faire accompagner, et accompagner à son tour. */
const GROUPES: readonly GroupeOnglets[] = [
  { id: 'onglets-accompagne', titre: 'Être accompagné', onglets: ONGLETS_MENTORE },
  { id: 'onglets-accompagner', titre: 'Accompagner', onglets: ONGLETS_MENTOR },
];

/** Cadre commun du mentorat : en-tête et onglets des deux rôles pour les membres participants. */
@Component({
  selector: 'app-mentorat',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FilAriane, GuideMentorat],
  templateUrl: './mentorat.html',
  styleUrl: './mentorat.scss',
})
export class MentoratPage {
  private readonly authService = inject(AuthService);
  protected readonly compteur = inject(CompteurDemandesMentorat);

  protected readonly role = computed(() => this.authService.utilisateur()?.role);
  protected readonly participe = computed(() => participeAuMentorat(this.role()));
  protected readonly gereProgrammes = computed(() => gereLesProgrammes(this.role()));
  protected readonly groupes = computed(() => this.participe() ? GROUPES : []);

  constructor() {
    if (this.participe()) this.compteur.actualiser();
  }
}
