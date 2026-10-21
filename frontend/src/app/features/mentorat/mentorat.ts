import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth-service';
import { CompteurDemandesMentorat } from '../../core/services/mentorat/compteur-demandes';
import { GuideMentorat } from './guide-mentorat/guide-mentorat';
import { FilAriane } from '../../shared/fil-ariane/fil-ariane';

interface Onglet {
  libelle: string;
  lien: string;
  icone: string;
  compteur?: boolean;
}

const ONGLETS_ETUDIANT: readonly Onglet[] = [
  { libelle: 'Trouver un mentor', lien: 'trouver', icone: 'pi-search' },
  { libelle: 'Mes demandes', lien: 'demandes', icone: 'pi-send' },
  { libelle: 'Mes mentorats', lien: 'suivis', icone: 'pi-comments' },
];

const ONGLETS_MENTOR: readonly Onglet[] = [
  { libelle: 'Demandes reçues', lien: 'recues', icone: 'pi-inbox', compteur: true },
  { libelle: 'Mes mentorés', lien: 'mentores', icone: 'pi-users' },
  { libelle: 'Mon offre', lien: 'offre', icone: 'pi-sliders-h' },
];

/** Cadre commun du mentorat : en-tête et onglets adaptés au rôle. */
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
  protected readonly onglets = computed(() => {
    switch (this.role()) {
      case 'ETUDIANT': return ONGLETS_ETUDIANT;
      case 'ALUMNI': return ONGLETS_MENTOR;
      default: return [];
    }
  });
  protected readonly introduction = computed(() => this.role() === 'ALUMNI'
    ? 'Accompagnez les étudiants de l’EPT dans leur parcours.'
    : 'Trouvez un alumni pour vous accompagner.');

  constructor() {
    if (this.role() === 'ALUMNI') this.compteur.actualiser();
  }
}
