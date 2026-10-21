import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnnuaireMembre, RoleAnnuaire } from '../../../core/services/models/annuaire.model';
import { AvatarMembre } from '../../../shared/images/avatar-membre';

interface PresentationRole {
  libelle: string;
  icone: string;
}

const PRESENTATION_ROLES: Record<Exclude<RoleAnnuaire, 'ORGANISME'>, PresentationRole> = {
  ALUMNI: { libelle: 'Alumni', icone: 'pi-graduation-cap' },
  ETUDIANT: { libelle: 'Étudiant', icone: 'pi-book' },
  PERSONNEL: { libelle: 'Personnel EPT', icone: 'pi-id-card' },
  VISITEUR: { libelle: 'Visiteur', icone: 'pi-user' },
};

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

  /** Le rôle, ou le type d’organisme, donne la couleur et le libellé du bandeau. */
  protected readonly presentation = computed<PresentationRole>(() => {
    const membre = this.membre();
    if (membre.role === 'ORGANISME') {
      return PRESENTATION_ORGANISMES[membre.typeOrganisme ?? ''] ?? ORGANISME_PAR_DEFAUT;
    }
    return PRESENTATION_ROLES[membre.role];
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
