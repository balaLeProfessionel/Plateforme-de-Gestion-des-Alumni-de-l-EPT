/** Miroirs des records `emploi/dto` du backend (#221, #222). */
export type ModeOffreEmploi = 'GEREE' | 'RELAYEE';
export type StatutOffreEmploi = 'SOUMISE' | 'PUBLIEE' | 'REFUSEE' | 'RETIREE';
export type TypeContrat = 'CDI' | 'CDD' | 'STAGE' | 'FREELANCE' | 'FONCTION_PUBLIQUE';
export type MotifSignalementOffre = 'LIEN_MORT' | 'ARNAQUE' | 'HORS_SUJET' | 'AUTRE';
export type TypeQuestionOffre = 'TEXTE' | 'OUI_NON';
export type StatutCandidatureEmploi = 'RECUE' | 'PRESELECTIONNEE' | 'ENTRETIEN' | 'RETENUE' | 'NON_RETENUE' | 'RETIREE';

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
export const QUESTIONS_MAX = 5;
export const LONGUEUR_INTITULE_QUESTION = 300;
export const LONGUEUR_LETTRE_EMPLOI = 3000;
export const LONGUEUR_REPONSE = 2000;
export const POIDS_MAX_CV = 5 * 1024 * 1024;
export const LIBELLES_STATUT_CANDIDATURE_EMPLOI: Record<StatutCandidatureEmploi, string> = {
  RECUE: 'Reçue', PRESELECTIONNEE: 'Présélectionnée', ENTRETIEN: 'Entretien', RETENUE: 'Retenue',
  NON_RETENUE: 'Non retenue', RETIREE: 'Retirée',
};

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
  lettreExigee: boolean;
  questions: QuestionOffre[];
}

export interface QuestionOffre {
  id: string;
  intitule: string;
  type: TypeQuestionOffre;
  obligatoire: boolean;
}

export interface OffreGereeRequete {
  titre: string;
  description: string;
  typeContrat: TypeContrat;
  lieu: string;
  dateExpiration: string;
  competences: string[];
  filieres: string[];
  lettreExigee: boolean;
  questions: { intitule: string; type: TypeQuestionOffre; obligatoire: boolean }[];
}

export interface MaCandidatureEmploi {
  id: string;
  offreId: string;
  titreOffre: string;
  entreprise: string;
  dateExpiration: string;
  offreExpiree: boolean;
  statut: StatutCandidatureEmploi;
  nomCv: string;
  lettreMotivation: string | null;
  reponses: { questionId: string; intitule: string; valeur: string }[];
  envoyeeLe: string;
  retireeLe: string | null;
  retirable: boolean;
}

export interface DernierCv {
  nomCv: string;
  envoyeLe: string;
}

export interface EnvoiCandidature {
  cv: File | null;
  reprendreCv: boolean;
  lettre: string;
  reponses: { questionId: string; valeur: string }[];
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
