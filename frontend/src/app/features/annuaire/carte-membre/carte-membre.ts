import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnnuaireMembre } from '../../../core/services/models/annuaire.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';
import { PRESENTATION_ROLES_MEMBRE, PresentationRole } from '../../../shared/roles/etiquette-role';

const PRESENTATION_ORGANISMES: Record<string, PresentationRole> = {
  ENTREPRISE: { libelle: 'Entreprise', icone: 'pi-building' },
  ETABLISSEMENT_ENSEIGNEMENT: { libelle: 'Établissement', icone: 'pi-building-columns' },
  INSTITUTION_PUBLIQUE: { libelle: 'Institution publique', icone: 'pi-building-columns' },
  ONG: { libelle: 'ONG', icone: 'pi-heart' },
};

const ORGANISME_PAR_DEFAUT: PresentationRole = { libelle: 'Organisme', icone: 'pi-building' };

@Component({
  selector: 'app-carte-membre',
  imports: [RouterLink, NgTemplateOutlet, AvatarMembre],
  templateUrl: './carte-membre.html',
  styleUrl: './carte-membre.scss',
})
export class CarteMembre {
  readonly membre = input.required<AnnuaireMembre>();

  protected readonly estOrganisme = computed(() => this.membre().role === 'ORGANISME');

  protected readonly nomAffiche = computed(() => {
    const membre = this.membre();
    return [membre.prenom, membre.nom].filter(Boolean).join(' ');
  });

  /** Nom du lien de la carte : le badge visuel « Mentor » y est repris pour les lecteurs d’écran. */
  protected readonly libelleLien = computed(() => {
    const debut = this.estOrganisme() ? 'Voir la fiche de ' : 'Consulter le profil de ';
    const mentor = this.membre().mentor;
    const suite = mentor === 'DISPONIBLE' ? ', mentor disponible' : mentor ? ', mentor' : '';
    return debut + this.nomAffiche() + suite;
  });

  /** Le rôle, ou le type d’organisme, donne la couleur et le libellé du bandeau. */
  protected readonly presentation = computed<PresentationRole>(() => {
    const membre = this.membre();
    if (membre.role === 'ORGANISME') {
      return PRESENTATION_ORGANISMES[membre.typeOrganisme ?? ''] ?? ORGANISME_PAR_DEFAUT;
    }
    return PRESENTATION_ROLES_MEMBRE[membre.role];
  });

  protected readonly enAttente = computed(() => this.membre().statutCompte === 'EN_ATTENTE');

  /** Promotion et filière pour les élèves et diplômés, secteur pour un organisme. */
  protected readonly parcours = computed(() => {
    const { role, anneeSortie, filiere, posteActuel } = this.membre();
    switch (role) {
      case 'ALUMNI':
        return joindre(anneeSortie ? `Promo ${anneeSortie}` : null, filiere);
      case 'ETUDIANT':
        return joindre(filiere, anneeSortie ? `Sortie prévue ${anneeSortie}` : null);
      case 'ORGANISME':
        return posteActuel || null;
      default:
        return null;
    }
  });

  /** Poste et ville pour une personne, localisation seule pour un organisme. */
  protected readonly activite = computed(() => {
    const { posteActuel, villeResidence } = this.membre();
    return this.estOrganisme() ? villeResidence || null : joindre(posteActuel, villeResidence);
  });

  protected readonly lienProfil = computed(() => {
    const membre = this.membre();
    if (!this.estOrganisme()) return ['/profil', membre.id];
    return membre.organismeId ? ['/organismes', membre.organismeId] : null;
  });
}

function joindre(...elements: (string | null | undefined)[]): string | null {
  return elements.filter(Boolean).join(' · ') || null;
}
