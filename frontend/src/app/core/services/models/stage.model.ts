/** Types de stage du cursus (miroir de TypeStage). */
export type TypeStage = 'INCLUSION' | 'MAITRISE' | 'PFE' | 'ALTERNANCE';
export const TYPES_STAGE: readonly TypeStage[] = ['INCLUSION', 'MAITRISE', 'PFE', 'ALTERNANCE'];
export const LIBELLES_TYPE_STAGE: Record<TypeStage, string> = {
  INCLUSION: 'Inclusion',
  MAITRISE: 'Maîtrise',
  PFE: 'Projet de fin d’études',
  ALTERNANCE: 'Alternance',
};

/** Miroir de StatutOffre. « Candidatures closes » se déduit de la date limite, ce n’est pas un statut. */
export type StatutOffre = 'SOUMISE' | 'PUBLIEE' | 'REFUSEE' | 'RETIREE';
export const LIBELLES_STATUT_OFFRE: Record<StatutOffre, string> = {
  SOUMISE: 'En attente de vérification',
  PUBLIEE: 'Publiée',
  REFUSEE: 'Refusée',
  RETIREE: 'Retirée',
};

/** Miroir de OffreStageResponse. */
export interface OffreStage {
  id: string;
  titre: string;
  description: string;
  competences: string;
  dureeMois: number;
  typeStage: TypeStage;
  lieu: string | null;
  dateDebutPrevue: string | null;
  nombrePlaces: number | null;
  dateLimiteCandidature: string;
  candidaturesOuvertes: boolean;
  statut: StatutOffre;
  /** Motif d’un refus ou d’un retrait : rempli seulement pour l’organisme de l’offre et l’administrateur Stages. */
  motifDecision: string | null;
  publieeLe: string | null;
  creeeLe: string;
  organisme: { id: string; nom: string; logoUrl: string | null };
  /** Illustration 16:9, ou null. */
  urlImage: string | null;
  /** Pièces jointes PDF ; vide dans les listes. */
  piecesJointes: PieceJointeOffre[];
  /** Le lecteur peut changer l’image et les pièces jointes (organisme de l’offre ou administrateur Stages). */
  modifiable: boolean;
}

export interface PieceJointeOffre {
  id: string;
  nom: string;
  /** Taille en octets. */
  taille: number;
}

/** Pièces jointes : PDF seulement, 3 au plus par offre, 5 Mo chacune (règles du serveur). */
export const PIECES_JOINTES_MAX = 3;
export const POIDS_MAX_PIECE = 5 * 1024 * 1024;

/** Miroir de OffreStageRequest. */
export interface OffreStageRequete {
  titre: string;
  description: string;
  competences: string;
  dureeMois: number;
  typeStage: TypeStage;
  lieu: string | null;
  dateDebutPrevue: string | null;
  nombrePlaces: number | null;
  dateLimiteCandidature: string;
}

/** Critères de la liste des offres, portés par l’URL. */
export interface CriteresOffres {
  type: TypeStage | '';
  organisme: string;
  lieu: string;
  /** Vrai par défaut : seules les offres dont la date limite n’est pas passée. */
  ouvertes: boolean;
  page: number;
}

export interface OrganismeOffres {
  id: string;
  nom: string;
}
