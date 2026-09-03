import { Component, input, output, signal, viewChildren } from '@angular/core';
import { Experience, ExperienceRequest } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { EtatCartes, ETAT_CARTES_VIDE } from '../etat-carte.model';
import { MessageSection } from '../message-section.model';
import {
  DemandeEnregistrement,
  ModeEnregistrement
} from '../demande-enregistrement.model';
import { CarteExperience } from '../carte-experience/carte-experience';

export type DemandeExperience = DemandeEnregistrement<ExperienceRequest>;

// Affiche la liste des experiences et le bouton d'ajout. Purement presentatif :
// meme les brouillons (cartes vierges non encore enregistrees) viennent de la
// page, pour qu'elle puisse en retirer un des que la creation a reussi.
//
// Deux modes d'enregistrement, choisis par la page :
//  - parCarte : chaque carte a son bouton, la liste relaie (enregistrerCarte)
//  - global   : un seul bouton en bas collecte toutes les cartes et emet
//               (enregistrerTout)
@Component({
  selector: 'app-liste-experiences',
  imports: [CarteExperience],
  templateUrl: './liste-experiences.html',
  styleUrl: './liste-experiences.scss'
})
export class ListeExperiences {
  readonly experiences = input<Experience[]>([]);
  // Cles des cartes vierges en cours de saisie
  readonly brouillons = input<string[]>([]);

  readonly modeEnregistrement = input<ModeEnregistrement>('parCarte');
  readonly libelleEnregistrerTout = input('Enregistrer mes expériences');

  readonly suggestions = input<OrganismeSuggestion[]>([]);
  readonly enRecherche = input(false);
  readonly etat = input<EtatCartes>(ETAT_CARTES_VIDE);

  readonly ajouter = output<void>();
  readonly abandonnerBrouillon = output<string>();
  readonly enregistrerCarte = output<DemandeExperience>();
  readonly enregistrerTout = output<DemandeExperience[]>();
  readonly supprimer = output<string>();
  readonly rechercherOrganisme = output<string>();

  // Les cartes detiennent leur formulaire : on les interroge au moment
  // d'enregistrer plutot que de suivre chaque frappe.
  private readonly cartes = viewChildren(CarteExperience);

  protected readonly erreurCollecte = signal<string | null>(null);

  protected enCoursPour(cle: string): boolean {
    return this.etat().clesEnCours.includes(cle);
  }

  protected messagePour(cle: string): MessageSection | null {
    return this.etat().messages[cle] ?? null;
  }

  protected collecterEtEmettre(): void {
    const demandes: DemandeExperience[] = [];
    let uneInvalide = false;

    for (const carte of this.cartes()) {
      const resultat = carte.collecter();
      if (resultat.statut === 'invalide') {
        // On continue la boucle : toutes les cartes fautives doivent
        // afficher leurs erreurs, pas seulement la premiere.
        uneInvalide = true;
      } else if (resultat.statut === 'valide') {
        demandes.push(resultat.demande);
      }
    }

    if (uneInvalide) {
      this.erreurCollecte.set(
        'Certaines cartes sont incomplètes. Corrigez-les avant d’enregistrer.'
      );
      return;
    }

    this.erreurCollecte.set(null);
    this.enregistrerTout.emit(demandes);
  }
}
