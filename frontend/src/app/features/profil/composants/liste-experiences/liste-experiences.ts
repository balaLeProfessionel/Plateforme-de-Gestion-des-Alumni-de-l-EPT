import { Component, input, output } from '@angular/core';
import { Experience, ExperienceRequest } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { EtatCartes, ETAT_CARTES_VIDE } from '../etat-carte.model';
import { MessageSection } from '../message-section.model';
import { CarteExperience } from '../carte-experience/carte-experience';

// Charge utile d'un enregistrement : id vaut null pour une creation.
// La cle sert a la page pour cibler le retour visuel sur la bonne carte.
export interface DemandeEnregistrement {
  id: string | null;
  cle: string;
  donnees: ExperienceRequest;
}

// Affiche la liste des experiences et le bouton d'ajout. Purement presentatif :
// meme les brouillons (cartes vierges non encore enregistrees) viennent de la
// page, pour qu'elle puisse en retirer un des que la creation a reussi.
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

  readonly suggestions = input<OrganismeSuggestion[]>([]);
  readonly enRecherche = input(false);
  readonly etat = input<EtatCartes>(ETAT_CARTES_VIDE);

  readonly ajouter = output<void>();
  readonly abandonnerBrouillon = output<string>();
  readonly enregistrer = output<DemandeEnregistrement>();
  readonly supprimer = output<string>();
  readonly rechercherOrganisme = output<string>();

  protected enCoursPour(cle: string): boolean {
    return this.etat().cleEnCours === cle;
  }

  protected messagePour(cle: string): MessageSection | null {
    const etat = this.etat();
    return etat.cleMessage === cle ? etat.message : null;
  }
}
