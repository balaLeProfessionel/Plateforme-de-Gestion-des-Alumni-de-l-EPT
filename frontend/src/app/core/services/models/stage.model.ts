/** Types de stage du cursus (miroir de TypeStage). */
export type TypeStage = 'INCLUSION' | 'MAITRISE' | 'PFE' | 'ALTERNANCE';
export const TYPES_STAGE: readonly TypeStage[] = ['INCLUSION', 'MAITRISE', 'PFE', 'ALTERNANCE'];
export const LIBELLES_TYPE_STAGE: Record<TypeStage, string> = {
  INCLUSION: 'Inclusion',
  MAITRISE: 'Maîtrise',
  PFE: 'Projet de fin d’études',
  ALTERNANCE: 'Alternance',
};

/**
 * Miroir de StatutOffre. « Candidatures closes » se déduit de la date limite ; LISTE_PUBLIEE clôt aussi les
 * candidatures (liste définitive publiée par l’école, STA-04).
 */
export type StatutOffre = 'SOUMISE' | 'PUBLIEE' | 'LISTE_PUBLIEE' | 'REFUSEE' | 'RETIREE';
export const LIBELLES_STATUT_OFFRE: Record<StatutOffre, string> = {
  SOUMISE: 'En attente de vérification',
  PUBLIEE: 'Publiée',
  LISTE_PUBLIEE: 'Liste publiée',
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
  /** Candidatures envoyées : dans les listes de l’organisme et de l’école, sinon null. */
  nombreCandidatures: number | null;
}

/** Miroir de StatutCandidature. « Retenue » et « non retenue » viennent de la liste définitive publiée (champ `resultat`). */
export type StatutCandidature = 'ENVOYEE' | 'RETIREE';
export const LIBELLES_STATUT_CANDIDATURE: Record<StatutCandidature, string> = { ENVOYEE: 'Envoyée', RETIREE: 'Retirée' };

/** Miroir de AvisOrganisme : jamais montré à l’étudiant. */
export type AvisOrganisme = 'EN_ATTENTE' | 'RETENUE' | 'NON_RETENUE';
export const LIBELLES_AVIS_ORGANISME: Record<AvisOrganisme, string> = {
  EN_ATTENTE: 'Sans avis', RETENUE: 'Retenue', NON_RETENUE: 'Non retenue',
};

/** Miroir de MaCandidatureResponse : la candidature vue par l’étudiant. */
export interface MaCandidature {
  id: string;
  offreId: string;
  titreOffre: string;
  organisme: string;
  dateLimiteCandidature: string;
  candidaturesOuvertes: boolean;
  statut: StatutCandidature;
  lettreMotivation: string | null;
  nomCv: string;
  envoyeeLe: string;
  retireeLe: string | null;
  /** Une fois la liste définitive publiée ; null avant. */
  resultat: ResultatCandidature | null;
}

export type ResultatCandidature = 'RETENUE' | 'NON_RETENUE';
export const LIBELLES_RESULTAT: Record<ResultatCandidature, string> = { RETENUE: 'Retenue', NON_RETENUE: 'Non retenue' };

/** Étudiant tel que le voient l’organisme et l’école (miroir de CandidatureRecueResponse.Etudiant). */
export interface EtudiantStage {
  id: string; prenom: string; nom: string; filiere: string | null; classe: string | null; anneeEntree: number | null; urlPhoto: string | null;
}

/** Miroir de CandidatureRecueResponse : vue par l’organisme de l’offre ou l’école (e-mail pour l’école seulement). */
export interface CandidatureRecue {
  id: string;
  etudiant: EtudiantStage;
  email: string | null;
  statut: StatutCandidature;
  avisOrganisme: AvisOrganisme;
  lettreMotivation: string | null;
  nomCv: string;
  envoyeeLe: string;
  avisDonneLe: string | null;
}

/** Lettre de motivation : 3000 caractères au plus (règle du serveur). */
export const LONGUEUR_LETTRE = 3000;

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

/** Miroir de StatutStage : liste définitive (STA-04) et stages déclarés par l’étudiant (STA-10). */
export type StatutStage = 'EN_PREPARATION' | 'CONFIRME' | 'ANNULE' | 'DECLARE' | 'REFUSE';
export const LIBELLES_STATUT_STAGE: Record<StatutStage, string> = {
  EN_PREPARATION: 'Brouillon', CONFIRME: 'Confirmé', ANNULE: 'Annulé', DECLARE: 'En attente de l’école', REFUSE: 'Refusé',
};

/** Miroir de LigneListeResponse : une ligne de la liste définitive, vue par l’administrateur Stages. */
export interface LigneListe {
  id: string;
  etudiant: EtudiantStage;
  email: string | null;
  /** Null si l’étudiant n’a pas postulé. */
  candidatureId: string | null;
  avisOrganisme: AvisOrganisme | null;
  statut: StatutStage;
  dateDebut: string | null;
  dateFin: string | null;
  motif: string | null;
  confirmeLe: string | null;
  annuleLe: string | null;
}

/** Miroir de ListeDefinitiveResponse. */
export interface ListeDefinitive {
  offreId: string;
  titreOffre: string;
  organisme: string;
  statutOffre: StatutOffre;
  dateLimiteCandidature: string;
  nombrePlaces: number | null;
  listePublieeLe: string | null;
  dateDebutParDefaut: string | null;
  dateFinParDefaut: string | null;
  lignes: LigneListe[];
}

/** Motif d’annulation d’un stage confirmé : 500 caractères au plus (règle du serveur). */
export const LONGUEUR_MOTIF_STAGE = 500;

/** Miroir de StagiaireResponse : vu par l’organisme une fois la liste publiée. */
export interface Stagiaire { id: string; etudiant: EtudiantStage; dateDebut: string; dateFin: string }

/** Miroir de MonStageResponse. */
export interface MonStage {
  id: string;
  offreId: string | null;
  sujet: string;
  organisme: string;
  typeStage: TypeStage;
  lieu: string | null;
  dateDebut: string;
  dateFin: string;
  /** Null pour une déclaration pas encore validée. */
  confirmeLe: string | null;
  /** CONFIRME, ou DECLARE / REFUSE pour un stage déclaré par l’étudiant. */
  statut: StatutStage;
  /** Motif d’un refus de déclaration. */
  motif: string | null;
  /** Vrai pour un stage trouvé par l’étudiant hors offre (STA-10). */
  declare: boolean;
  /** Rapport de stage (STA-07), pour un stage confirmé. */
  rapport: Rapport | null;
}

/** Miroir de DeclarationResponse : stage déclaré, vu par l’étudiant ou l’administrateur Stages (e-mail pour l’école). */
export interface Declaration {
  id: string;
  etudiant: EtudiantStage;
  email: string | null;
  /** Null tant que l’organisme proposé par l’étudiant n’est pas enregistré. */
  organismeId: string | null;
  organisme: string;
  typeStage: TypeStage;
  sujet: string;
  lieu: string | null;
  dateDebut: string;
  dateFin: string;
  tuteurNom: string;
  tuteurFonction: string | null;
  tuteurEmail: string | null;
  tuteurTelephone: string | null;
  statut: StatutStage;
  motif: string | null;
  creeLe: string;
  decideLe: string | null;
}

/** Miroir de DeclarationStageRequest : organismeId pour un organisme connu, sinon nomOrganisme. */
export interface DeclarationRequete {
  organismeId: string | null;
  nomOrganisme: string | null;
  typeStage: TypeStage;
  sujet: string;
  lieu: string | null;
  dateDebut: string;
  dateFin: string;
  tuteurNom: string;
  tuteurFonction: string | null;
  tuteurEmail: string | null;
  tuteurTelephone: string | null;
}

/** Miroir de EtudiantSuggestionResponse. */
export type EtudiantSuggestion = EtudiantStage;

/** Critères de recherche d’un étudiant à ajouter : nom, code de classe, identifiant de filière ('' = tous). */
export interface CritereEtudiants { texte: string; classe: string; filiere: string }

/** Déroulement d’un stage confirmé, déduit des dates par le serveur. */
export type Deroulement = 'A_VENIR' | 'EN_COURS' | 'TERMINE';
export const LIBELLES_DEROULEMENT: Record<Deroulement, string> = { A_VENIR: 'À venir', EN_COURS: 'En cours', TERMINE: 'Terminé' };

/** Miroir de SuiviStageResponse (STA-08) : l’e-mail de l’étudiant n’est donné qu’à l’école. */
export interface SuiviStage {
  id: string;
  offreId: string | null;
  etudiant: EtudiantStage;
  email: string | null;
  organismeId: string | null;
  organisme: string;
  typeStage: TypeStage;
  sujet: string;
  lieu: string | null;
  dateDebut: string;
  dateFin: string;
  deroulement: Deroulement;
  encadrant: { id: string; prenom: string; nom: string; email: string } | null;
  tuteurNom: string | null;
  tuteurFonction: string | null;
  tuteurEmail: string | null;
  tuteurTelephone: string | null;
  declare: boolean;
  convention: EtatConvention;
  evaluation: EtatEvaluation;
  stageValide: boolean | null;
  rapport: Rapport;
}

/** Rapport de stage (STA-07). EN_RETARD : date limite dépassée sans dépôt. */
export type EtatRapport = 'SANS_DATE' | 'ATTENDU' | 'DEPOSE' | 'EN_RETARD';

export interface Rapport {
  dateLimite: string | null;
  nomFichier: string | null;
  deposeLe: string | null;
  etat: EtatRapport;
  /** La date limite n’est pas dépassée. */
  depotOuvert: boolean;
}

/** Évaluation du stagiaire (STA-06). */
export type EtatEvaluation = 'AUCUNE' | 'BROUILLON' | 'SOUMISE';

export const LIBELLES_EVALUATION: Record<EtatEvaluation, string> = {
  AUCUNE: 'Pas commencée',
  BROUILLON: 'En cours de saisie',
  SOUMISE: 'Remise',
};

export type NiveauCritere = 'TRES_SATISFAISANT' | 'SATISFAISANT' | 'A_AMELIORER' | 'NON_APPLICABLE';

export const LIBELLES_NIVEAU: Record<NiveauCritere, string> = {
  TRES_SATISFAISANT: 'Très satisfaisant',
  SATISFAISANT: 'Satisfaisant',
  A_AMELIORER: 'À améliorer',
  NON_APPLICABLE: 'Non applicable',
};

export type AppreciationGenerale = 'TRES_SATISFAISANT' | 'SATISFAISANT' | 'MOYENNEMENT_SATISFAISANT' | 'INSATISFAISANT';

export const LIBELLES_APPRECIATION: Record<AppreciationGenerale, string> = {
  TRES_SATISFAISANT: 'Très satisfaisant',
  SATISFAISANT: 'Satisfaisant',
  MOYENNEMENT_SATISFAISANT: 'Moyennement satisfaisant',
  INSATISFAISANT: 'Insatisfaisant',
};

export interface CritereGrille { code: string; section: 'TECHNIQUE' | 'PERSONNELLE'; libelle: string }

export interface SaisieEvaluation {
  criteres: Record<string, NiveauCritere>;
  dureeEffectiveMois: number | null;
  pointsForts: string | null;
  axesAmelioration: string | null;
  observations: string | null;
  appreciationGenerale: AppreciationGenerale | null;
  avisTuteurValide: boolean | null;
}

export interface Evaluation extends SaisieEvaluation {
  stage: SuiviStage;
  grille: CritereGrille[];
  etat: EtatEvaluation;
  saisieParEcole: boolean;
  soumiseLe: string | null;
  stageValide: boolean | null;
  decideLe: string | null;
  modifiable: boolean;
}

export const LONGUEUR_TEXTE_EVALUATION = 2000;

/** État de la convention tripartite (STA-05) : complète quand les trois signatures et le scan sont enregistrés. */
export type EtatConvention = 'AUCUNE' | 'EN_COURS' | 'COMPLETE';

export const LIBELLES_CONVENTION: Record<EtatConvention, string> = {
  AUCUNE: 'Pas commencée',
  EN_COURS: 'En cours',
  COMPLETE: 'Complète',
};

export type PartieConvention = 'ETUDIANT' | 'ORGANISME' | 'ECOLE';

export interface ClausesConvention { assurance: string | null; indemnite: string | null; logement: string | null; clauseConfidentialite: boolean }

export interface Convention extends ClausesConvention {
  stage: SuiviStage;
  existe: boolean;
  signeeEtudiantLe: string | null;
  signeeOrganismeLe: string | null;
  signeeEcoleLe: string | null;
  scanNom: string | null;
  etat: EtatConvention;
  modifieLe: string | null;
}

export const LONGUEUR_CLAUSE = 500;

/** Ce que suit le membre connecté : stages encadrés et de son département (personnel), accueillis (organisme). */
export interface MesSuivis {
  encadres: SuiviStage[];
  departement: SuiviStage[];
  accueillis: SuiviStage[];
}

export interface PersonnelSuggestion { id: string; prenom: string; nom: string; email: string; urlPhoto: string | null }

export interface Tuteur { nom: string; fonction: string | null; email: string | null; telephone: string | null }
