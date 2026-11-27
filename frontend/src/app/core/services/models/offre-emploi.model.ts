/** Miroirs des records `emploi/dto` du backend (#221). */
export type ModeOffreEmploi = 'GEREE' | 'RELAYEE';
export type StatutOffreEmploi = 'SOUMISE' | 'PUBLIEE' | 'REFUSEE' | 'RETIREE';
export type TypeContrat = 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'FONCTION_PUBLIQUE';
export type MotifSignalementOffre = 'LIEN_MORT' | 'ARNAQUE' | 'HORS_SUJET' | 'AUTRE';

export const TYPES_CONTRAT: readonly TypeContrat[] = ['CDI', 'CDD', 'STAGE', 'FREELANCE', 'FONCTION_PUBLIQUE'];
export const LIBELLES_TYPE_CONTRAT: Record<TypeContrat, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance', FONCTION_PUBLIQUE: 'Fonction publique',
};
export const LIBELLES_STATUT_OFFRE_EMPLOI: Record<StatutOffreEmploi, string> = {
  SOUMISE: 'En attente de vérification', PUBLIEE: 'Publiée', REFUSEE: 'Refusée', RETIREE: 'Retirée',
};
export const MOTIFS_SIGNALEMENT: readonly { valeur: MotifSignalementOffre; libelle: string }[] = [
  { valeur: 'LIEN_MORT', libelle: 'Le lien ne fonctionne plus' },
  { valeur: 'ARNAQUE', libelle: 'Arnaque ou demande d’argent' },
  { valeur: 'HORS_SUJET', libelle: 'Hors sujet' },
  { valeur: 'AUTRE', libelle: 'Autre raison' },
];

/** Une offre reste en ligne six mois au plus (même règle que le serveur). */
export const DUREE_MAX_MOIS = 6;
export const COMPETENCES_MAX = 15;

export interface AuteurOffre {
  id: string;
  prenom: string | null;
  nom: string;
  photo: string | null;
  role: string;
  anneeSortie: number | null;
  filiere: string | null;
  organismeId: string | null;
}

export interface OffreEmploi {
  id: string;
  mode: ModeOffreEmploi;
  titre: string;
  description: string;
  entreprise: string;
  organismeId: string | null;
  typeContrat: TypeContrat;
  lieu: string;
  dateExpiration: string;
  expiree: boolean;
  lienSource: string | null;
  source: string | null;
  competences: string[];
  filieres: { id: string; nom: string }[];
  statut: StatutOffreEmploi;
  motifDecision: string | null;
  auteur: AuteurOffre;
  publieeLe: string | null;
  creeeLe: string;
  modifiable: boolean;
  signalable: boolean;
}

export interface OffreRelayeeRequete {
  titre: string;
  description: string;
  entreprise: string;
  typeContrat: TypeContrat;
  lieu: string;
  dateExpiration: string;
  lienSource: string;
  source: string | null;
  competences: string[];
  filieres: string[];
}

export interface CriteresOffresEmploi {
  recherche: string;
  type: TypeContrat | '';
  lieu: string;
  filiere: string;
  expirees: boolean;
  page: number;
}
