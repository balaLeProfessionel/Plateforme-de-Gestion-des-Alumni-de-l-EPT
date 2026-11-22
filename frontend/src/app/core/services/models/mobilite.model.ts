import { Classe } from './classe.model';

export type TypeMobilite = 'ECHANGE' | 'DOUBLE_DIPLOME' | 'ENSEIGNEMENT_RECHERCHE';
export type PublicVise = 'ETUDIANTS' | 'ENSEIGNANTS' | 'TOUS';
export type PeriodeMobilite = 'SEMESTRE_1' | 'SEMESTRE_2' | 'ANNEE' | 'SEJOUR';
export type StatutOffreMobilite = 'PUBLIEE' | 'CLOTUREE' | 'LISTE_PUBLIEE' | 'RETIREE';
export type TypePiece = 'LETTRE_MOTIVATION' | 'RELEVES_NOTES' | 'CERTIFICAT_LANGUE' | 'CV' | 'AUTRE';

export const TYPES_MOBILITE: readonly TypeMobilite[] = ['ECHANGE', 'DOUBLE_DIPLOME', 'ENSEIGNEMENT_RECHERCHE'];
export const PUBLICS_VISES: readonly PublicVise[] = ['ETUDIANTS', 'ENSEIGNANTS', 'TOUS'];
export const PERIODES_MOBILITE: readonly PeriodeMobilite[] = ['SEMESTRE_1', 'SEMESTRE_2', 'ANNEE', 'SEJOUR'];
export const TYPES_PIECE: readonly TypePiece[] = ['LETTRE_MOTIVATION', 'RELEVES_NOTES', 'CERTIFICAT_LANGUE', 'CV', 'AUTRE'];

export const LIBELLES_TYPE_MOBILITE: Record<TypeMobilite, string> = {
  ECHANGE: 'Échange',
  DOUBLE_DIPLOME: 'Double diplôme',
  ENSEIGNEMENT_RECHERCHE: 'Enseignement ou recherche',
};

export const LIBELLES_PUBLIC_VISE: Record<PublicVise, string> = {
  ETUDIANTS: 'Étudiants',
  ENSEIGNANTS: 'Enseignants',
  TOUS: 'Étudiants et enseignants',
};

export const LIBELLES_PERIODE: Record<PeriodeMobilite, string> = {
  SEMESTRE_1: 'Semestre 1',
  SEMESTRE_2: 'Semestre 2',
  ANNEE: 'Année universitaire',
  SEJOUR: 'Séjour court',
};

export const LIBELLES_STATUT_OFFRE_MOBILITE: Record<StatutOffreMobilite, string> = {
  PUBLIEE: 'Publiée',
  CLOTUREE: 'Close',
  LISTE_PUBLIEE: 'Liste publiée',
  RETIREE: 'Retirée par l’école',
};

export const LIBELLES_PIECE: Record<TypePiece, string> = {
  LETTRE_MOTIVATION: 'Lettre de motivation',
  RELEVES_NOTES: 'Relevés de notes',
  CERTIFICAT_LANGUE: 'Certificat de langue',
  CV: 'CV',
  AUTRE: 'Autre document',
};

/** Documents qu’une offre peut joindre, et poids de chacun : identiques au serveur. */
export const PIECES_OFFRE_MOBILITE_MAX = 5;
export const POIDS_MAX_PIECE_MOBILITE = 5 * 1024 * 1024;

/** Miroir de OffreMobiliteResponse. */
export interface OffreMobilite {
  id: string;
  titre: string;
  description: string;
  type: TypeMobilite;
  publicVise: PublicVise;
  pays: string;
  ville: string | null;
  anneeUniversitaire: string;
  periode: PeriodeMobilite;
  dureeSemaines: number | null;
  nombrePlaces: number;
  dateLimite: string;
  candidaturesOuvertes: boolean;
  statut: StatutOffreMobilite;
  motifRetrait: string | null;
  publieeLe: string;
  organisme: { id: string; nom: string; logoUrl: string | null; pays: string | null };
  filieres: { id: string; nom: string }[];
  classes: Classe[];
  piecesDemandees: TypePiece[];
  piecesJointes: { id: string; nom: string; taille: number }[];
  modifiable: boolean;
  /** Rempli pour un étudiant ou un enseignant. */
  eligibilite: { eligible: boolean; raison: string | null } | null;
  /** Candidatures non retirées, pour qui gère l’offre ; au-delà de zéro, seules la date limite et les places changent. */
  nombreCandidatures: number | null;
}

/** Miroir de OffreMobiliteRequest. */
export interface OffreMobiliteRequete {
  titre: string;
  description: string;
  type: TypeMobilite;
  publicVise: PublicVise;
  pays: string;
  ville: string | null;
  anneeUniversitaire: string;
  periode: PeriodeMobilite;
  dureeSemaines: number | null;
  nombrePlaces: number;
  dateLimite: string;
  filiereIds: string[];
  classes: Classe[];
  piecesDemandees: TypePiece[];
}

export interface CriteresOffresMobilite {
  type: TypeMobilite | '';
  pays: string;
  periode: PeriodeMobilite | '';
  annee: string;
  eligibles: boolean;
  page: number;
}

/** « 2026-2027 » pour une date de septembre 2026 ou de juin 2027 : l’année universitaire commence en septembre. */
export function anneeUniversitaire(date: Date, decalage = 0): string {
  const debut = (date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1) + decalage;
  return `${debut}-${debut + 1}`;
}

/** Ligne de période lisible : « Semestre 1 · 2027-2028 », « Séjour de 6 semaines · 2027-2028 ». */
export function periodeLisible(offre: Pick<OffreMobilite, 'periode' | 'dureeSemaines' | 'anneeUniversitaire'>): string {
  const periode = offre.periode === 'SEJOUR' && offre.dureeSemaines
    ? `Séjour de ${offre.dureeSemaines} semaine${offre.dureeSemaines > 1 ? 's' : ''}`
    : LIBELLES_PERIODE[offre.periode];
  return `${periode} · ${offre.anneeUniversitaire}`;
}

export type StatutCandidatureMobilite = 'SOUMISE' | 'RETIREE' | 'RETENUE' | 'LISTE_ATTENTE' | 'NON_RETENUE' | 'DESISTEE';

export const LIBELLES_STATUT_CANDIDATURE_MOBILITE: Record<StatutCandidatureMobilite, string> = {
  SOUMISE: 'Envoyée',
  RETIREE: 'Retirée',
  RETENUE: 'Retenue',
  LISTE_ATTENTE: 'Sur liste d’attente',
  NON_RETENUE: 'Non retenue',
  DESISTEE: 'Désistée',
};

/** Miroir de CandidatureMobiliteResponse. */
export interface CandidatureMobilite {
  id: string;
  offre: {
    id: string; titre: string; organisme: string; type: TypeMobilite; periode: PeriodeMobilite; dureeSemaines: number | null;
    anneeUniversitaire: string; dateLimite: string; candidaturesOuvertes: boolean; statut: StatutOffreMobilite; piecesDemandees: TypePiece[];
  };
  statut: StatutCandidatureMobilite;
  rangAttente: number | null;
  soumiseLe: string;
  retireeLe: string | null;
  pieces: { id: string; type: TypePiece; nom: string; taille: number }[];
  /** Le dossier peut encore être retiré, complété ou renvoyé. */
  modifiable: boolean;
}

/** Un dossier vu par le chef du service mobilité ou, retenu, par l’institut. */
export interface DossierMobilite {
  id: string;
  candidat: { id: string; prenom: string; nom: string; role: string; filiere: string | null; classe: string | null };
  statut: StatutCandidatureMobilite;
  rangAttente: number | null;
  soumiseLe: string;
  pieces: { id: string; type: TypePiece; nom: string; taille: number }[];
  /** Autre offre de la même période où le candidat est déjà retenu. */
  retenuAilleurs: string | null;
}

/** Miroir de CandidaturesOffreResponse. */
export interface CandidaturesOffre {
  offre: {
    id: string; titre: string; organisme: string; statut: StatutOffreMobilite; nombrePlaces: number; dateLimite: string;
    anneeUniversitaire: string; periode: PeriodeMobilite; dureeSemaines: number | null; decisionsOuvertes: boolean; listePublieeLe: string | null;
  };
  dossiers: DossierMobilite[];
  retenues: number;
  enAttente: number;
  sansDecision: number;
  blocagePublication: string | null;
}

export type DecisionMobilite = 'RETENUE' | 'LISTE_ATTENTE' | 'NON_RETENUE';

export type SensMobilite = 'SORTANTE' | 'ENTRANTE';
export type StatutMobilite = 'PROPOSEE' | 'REFUSEE' | 'PREVUE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
export const STATUTS_MOBILITE: readonly StatutMobilite[] = ['PROPOSEE', 'PREVUE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REFUSEE'];

export const LIBELLES_SENS: Record<SensMobilite, string> = { SORTANTE: 'Sortante', ENTRANTE: 'Entrante' };
export const LIBELLES_STATUT_MOBILITE: Record<StatutMobilite, string> = {
  PROPOSEE: 'Proposée',
  REFUSEE: 'Refusée',
  PREVUE: 'Prévue',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};
/** Statuts que le chef peut donner ensuite, comme le serveur les autorise. */
export const SUITES_STATUT: Record<StatutMobilite, readonly StatutMobilite[]> = {
  PROPOSEE: [], REFUSEE: [], PREVUE: ['EN_COURS', 'ANNULEE'], EN_COURS: ['TERMINEE', 'ANNULEE'], TERMINEE: [], ANNULEE: [],
};

/** Miroir de MobiliteResponse. */
export interface Mobilite {
  id: string;
  sens: SensMobilite;
  statut: StatutMobilite;
  type: TypeMobilite;
  anneeUniversitaire: string;
  dateDebut: string | null;
  dateFin: string | null;
  organisme: { id: string; nom: string };
  personne: { id: string | null; prenom: string; nom: string; email: string | null };
  programmeOrigine: string | null;
  filiereAccueil: string | null;
  filiereAccueilId: string | null;
  offre: { id: string; titre: string; periode: PeriodeMobilite } | null;
  motif: string | null;
  creeeLe: string;
}

/** Miroir de AccueilRequest : un étudiant accueilli à l’EPT. */
export interface AccueilRequete {
  prenom: string;
  nom: string;
  email: string | null;
  programmeOrigine: string;
  filiereAccueilId: string;
  type: TypeMobilite;
  anneeUniversitaire: string;
  dateDebut: string | null;
  dateFin: string | null;
}

export interface EvenementHistorique {
  objet: 'OFFRE' | 'CANDIDATURE' | 'MOBILITE';
  action: string;
  details: string | null;
  motif: string | null;
  auteur: string;
  date: string;
}

export const LIBELLES_ACTION: Record<string, string> = {
  PUBLICATION_OFFRE: 'Offre publiée', MODIFICATION_OFFRE: 'Offre modifiée', CLOTURE_OFFRE: 'Offre close', RETRAIT_OFFRE: 'Offre retirée',
  SOUMISSION_CANDIDATURE: 'Candidature envoyée', RETRAIT_CANDIDATURE: 'Candidature retirée', DECISION_CANDIDATURE: 'Décision',
  PUBLICATION_LISTE: 'Liste publiée', DESISTEMENT: 'Désistement', PROMOTION_LISTE_ATTENTE: 'Place donnée depuis la liste d’attente',
  CREATION_MOBILITE: 'Mobilité créée', CHANGEMENT_STATUT_MOBILITE: 'Statut changé', PROPOSITION_ACCUEIL: 'Étudiant proposé',
  MODIFICATION_ACCUEIL: 'Proposition corrigée', ACCEPTATION_ACCUEIL: 'Proposition acceptée', REFUS_ACCUEIL: 'Proposition refusée',
};

/** Miroir de FluxResponse. */
export interface FluxMobilites {
  anneeUniversitaire: string;
  annees: string[];
  lignes: { organismeId: string; organisme: string; sortantes: number; entrantes: number }[];
  sortantes: number;
  entrantes: number;
}

/** Étapes d’une mobilité acceptée, de prévue à terminée. */
export function etapesMobilite(m: Pick<Mobilite, 'statut'>): { titre: string; etat: string; avancement: 'fait' | 'en-cours' | 'a-venir' | 'refuse' }[] {
  if (m.statut === 'PROPOSEE') return [{ titre: 'Proposition', etat: 'à examiner par l’école', avancement: 'en-cours' }];
  if (m.statut === 'REFUSEE') return [{ titre: 'Proposition', etat: 'refusée', avancement: 'refuse' }];
  const rang = { PREVUE: 0, EN_COURS: 1, TERMINEE: 2, ANNULEE: -1 }[m.statut];
  if (rang === -1) return [{ titre: 'Mobilité', etat: 'annulée', avancement: 'refuse' }];
  return [
    { titre: 'Prévue', etat: '', avancement: rang > 0 ? 'fait' : 'en-cours' },
    { titre: 'En cours', etat: '', avancement: rang > 1 ? 'fait' : rang === 1 ? 'en-cours' : 'a-venir' },
    { titre: 'Terminée', etat: '', avancement: rang === 2 ? 'fait' : 'a-venir' },
  ];
}
