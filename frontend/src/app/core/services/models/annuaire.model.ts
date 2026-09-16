export type RoleAnnuaire = 'ETUDIANT' | 'ALUMNI' | 'PERSONNEL' | 'VISITEUR' | 'ORGANISME';
export type TypeMembreAnnuaire = RoleAnnuaire | 'TOUS';
export type TriAnnuaire = 'ALPHABETIQUE' | 'PROMOTION_DESC';

export interface AnnuaireMembre {
  id: string;
  nom: string;
  prenom: string | null;
  role: RoleAnnuaire;
  statutCompte: 'ACTIF' | 'EN_ATTENTE';
  urlPhoto: string | null;
  posteActuel: string | null;
  villeResidence: string | null;
  filiere: string | null;
  anneeSortie: number | null;
}

export interface PageAnnuaire {
  contenu: AnnuaireMembre[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

export interface FiltresAnnuaire {
  recherche: string;
  role: TypeMembreAnnuaire;
  filiere: string;
  promotion: string;
  ville: string;
  tri: TriAnnuaire;
  page: number;
  taille: number;
}
