/** Miroirs des records `emploi/dto` du backend (#221, #222, #223). */
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

export const LIBELLES_MOTIF_SIGNALEMENT = Object.fromEntries(MOTIFS_SIGNALEMENT.map((m) => [m.valeur, m.libelle])) as
  Record<MotifSignalementOffre, string>;

/** Files de modération de l’administration (#224). */
export type FileModerationOffres = 'A_VERIFIER' | 'SIGNALEES' | 'PUBLIEES';
/** Motif d’un refus ou d’un retrait : envoyé à l’auteur de l’offre. */
export const LONGUEUR_MOTIF_DECISION = 500;

/** Offre vue par l’administration des offres, avec les signalements en attente (#224). */
export interface OffreAModerer {
  offre: OffreEmploi;
  signalements: { id: string; motif: MotifSignalementOffre; commentaire: string | null; creeLe: string; auteur: string }[];
}

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
/** Libellé du bouton qui donne ce statut à une candidature (#223). */
export const ACTIONS_STATUT_CANDIDATURE: Partial<Record<StatutCandidatureEmploi, string>> = {
  PRESELECTIONNEE: 'Présélectionner', ENTRETIEN: 'Proposer un entretien', RETENUE: 'Retenir', NON_RETENUE: 'Ne pas retenir',
};
export const LONGUEUR_NOTE_PRIVEE = 2000;

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
  /** Offre gérée dont le recrutement est clôturé : plus de candidature ni de modification. */
  cloturee: boolean;
  /** Le lecteur traite les candidatures de cette offre gérée (son organisme, ou l’administration). */
  candidaturesConsultables: boolean;
  /** « Mes offres » d’un organisme : candidatures reçues (hors retirées) et celles encore à traiter. */
  candidatures?: { total: number; aTraiter: number } | null;
}

/** Candidature reçue, vue par le recruteur (#223). */
export interface CandidatureRecueEmploi {
  id: string;
  candidat: {
    id: string;
    prenom: string;
    nom: string;
    role: string;
    urlPhoto: string | null;
    filiere: string | null;
    classe: string | null;
    anneeEntree: number | null;
    anneeSortie: number | null;
    competences: string[];
  };
  statut: StatutCandidatureEmploi;
  statutsSuivants: StatutCandidatureEmploi[];
  nomCv: string;
  cvDisponible: boolean;
  lettreMotivation: string | null;
  reponses: { questionId: string; intitule: string; valeur: string }[];
  notePrivee: string | null;
  envoyeeLe: string;
  historique: { statut: StatutCandidatureEmploi; le: string; auteur: string | null }[];
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
  /** Faux une fois le CV effacé après la durée de conservation. */
  cvDisponible: boolean;
  lettreMotivation: string | null;
  reponses: { questionId: string; intitule: string; valeur: string }[];
  envoyeeLe: string;
  retireeLe: string | null;
  retirable: boolean;
  /** Statuts par lesquels la candidature est passée : le recruteur peut sauter des étapes. */
  statutsAtteints: StatutCandidatureEmploi[];
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
