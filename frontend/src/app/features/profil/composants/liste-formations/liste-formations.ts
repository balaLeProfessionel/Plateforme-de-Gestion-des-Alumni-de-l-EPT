import { Component, input, model, output, signal, viewChildren } from '@angular/core';
import { Formation, FormationRequest } from '../../../../core/services/models/profil.model';
import { OrganismeSuggestion } from '../../../../core/services/models/organisme.model';
import { ParcoursPrerempli } from '../prerempli';
import { EtatCartes, ETAT_CARTES_VIDE } from '../etat-carte.model';
import { MessageSection } from '../message-section.model';
import { DemandeEnregistrement, ModeEnregistrement } from '../demande-enregistrement.model';
import { CarteFormation } from '../carte-formation/carte-formation';
import { ResumeParcours } from '../resume-parcours/resume-parcours';
import { repliCartes } from '../repli-cartes';
import { TYPES_FORMATION } from '../../../../core/data/types-formation';

export type DemandeFormation = DemandeEnregistrement<FormationRequest>;

// Affiche la liste des formations et le bouton d'ajout. Purement presentatif :
// meme les brouillons (cartes vierges non encore enregistrees) viennent de la
// page, pour qu'elle puisse en retirer un des que la creation a reussi.
//
// Deux modes d'enregistrement, choisis par la page :
//  - parCarte : chaque carte a son bouton, la liste relaie (enregistrerCarte)
//  - global   : un seul bouton en bas collecte toutes les cartes et emet
//               (enregistrerTout)
@Component({
  selector: 'app-liste-formations',
  imports: [CarteFormation, ResumeParcours],
  templateUrl: './liste-formations.html',
  styleUrl: './liste-formations.scss'
})
export class ListeFormations {
  readonly formations = input<Formation[]>([]);
  // Cles des cartes vierges en cours de saisie
  readonly brouillons = input<string[]>([]);
  // Valeurs initiales des brouillons venus d'un CV, par cle de brouillon
  readonly preremplis = input<Readonly<Record<string, ParcoursPrerempli>>>({});

  readonly modeEnregistrement = input<ModeEnregistrement>('parCarte');
  readonly libelleEnregistrerTout = input('Enregistrer mes formations');

  readonly suggestions = input<OrganismeSuggestion[]>([]);
  readonly enRecherche = input(false);
  readonly etat = input<EtatCartes>(ETAT_CARTES_VIDE);
  /** Cartes repliées en résumés, une seule ouverte à la fois (« Modifier mon profil »). */
  readonly replie = input(false);
  readonly ouverte = model<string | null>(null);
  protected readonly repli = repliCartes(this.ouverte, this.etat, 'libelle');
  protected readonly libelleType = (type: string) => TYPES_FORMATION.find((t) => t.value === type)?.label ?? null;

  readonly ajouter = output<void>();
  readonly abandonnerBrouillon = output<string>();
  readonly enregistrerCarte = output<DemandeFormation>();
  readonly enregistrerTout = output<DemandeFormation[]>();
  readonly supprimer = output<string>();
  readonly rechercherOrganisme = output<string>();

  // Les cartes detiennent leur formulaire : on les interroge au moment
  // d'enregistrer plutot que de suivre chaque frappe.
  private readonly cartes = viewChildren(CarteFormation);

  protected readonly erreurCollecte = signal<string | null>(null);

  protected enCoursPour(cle: string): boolean {
    return this.etat().clesEnCours.includes(cle);
  }

  protected messagePour(cle: string): MessageSection | null {
    return this.etat().messages[cle] ?? null;
  }

  protected collecterEtEmettre(): void {
    const demandes: DemandeFormation[] = [];
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
