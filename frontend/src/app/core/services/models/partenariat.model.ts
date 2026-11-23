/** Conventions-cadres de partenariat entre l’EPT et un organisme (miroir des records du paquet `partenariat`). */

export type StatutConvention = 'DEMANDEE' | 'EN_EXAMEN' | 'EN_NEGOCIATION' | 'ACTIVE' | 'REFUSEE' | 'ANNULEE' | 'RESILIEE' | 'EXPIREE';
export type OrigineConvention = 'ORGANISME' | 'ECOLE';
export type ActionConvention =
  | 'DEMANDE' | 'MODIFICATION_DEMANDE' | 'ANNULATION' | 'SAISIE' | 'MODIFICATION' | 'EXAMEN' | 'NEGOCIATION'
  | 'ACTIVATION' | 'REFUS' | 'RESILIATION' | 'EXPIRATION' | 'AJOUT_PIECE' | 'RETRAIT_PIECE';

export interface PieceConvention {
  id: string;
  nomFichier: string;
  taille: number;
  deposeeParOrganisme: boolean;
  ajouteeLe: string;
  supprimable: boolean;
}

export interface Convention {
  id: string;
  organismeId: string;
  organismeNom: string;
  organismeLogoUrl: string | null;
  objet: string;
  domaines: string | null;
  message: string | null;
  statut: StatutConvention;
  origine: OrigineConvention;
  dateSignature: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  /** Seulement pour une convention active. */
  joursRestants: number | null;
  expireBientot: boolean;
  motifDecision: string | null;
  creeeLe: string;
  modifieeLe: string;
  pieces: PieceConvention[];
}

export interface HistoriqueConvention {
  action: ActionConvention;
  details: string | null;
  motif: string | null;
  auteur: string;
  date: string;
}

export interface DemandeConventionRequete {
  objet: string;
  domaines: string | null;
  message: string;
}

export interface DatesConvention {
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
}

export interface SaisieConventionRequete extends Partial<DatesConvention> {
  organismeId: string;
  objet: string;
  domaines: string | null;
  statut: 'ACTIVE' | 'EN_NEGOCIATION';
}

export interface ModificationConventionRequete extends Partial<DatesConvention> {
  objet: string;
  domaines: string | null;
}

export interface CriteresConventions {
  statut: StatutConvention | '';
  recherche: string;
  expireBientot: boolean;
  page: number;
}

export const STATUTS_CONVENTION: readonly StatutConvention[] = [
  'DEMANDEE', 'EN_EXAMEN', 'EN_NEGOCIATION', 'ACTIVE', 'EXPIREE', 'RESILIEE', 'REFUSEE', 'ANNULEE',
];

export const LIBELLES_STATUT_CONVENTION: Record<StatutConvention, string> = {
  DEMANDEE: 'Demandée',
  EN_EXAMEN: 'En examen',
  EN_NEGOCIATION: 'En négociation',
  ACTIVE: 'Active',
  REFUSEE: 'Refusée',
  ANNULEE: 'Annulée',
  RESILIEE: 'Résiliée',
  EXPIREE: 'Expirée',
};

export const LIBELLES_ACTION_CONVENTION: Record<ActionConvention, string> = {
  DEMANDE: 'Demande déposée',
  MODIFICATION_DEMANDE: 'Demande modifiée',
  ANNULATION: 'Demande annulée',
  SAISIE: 'Convention enregistrée par l’école',
  MODIFICATION: 'Convention modifiée',
  EXAMEN: 'Prise en examen',
  NEGOCIATION: 'Passage en négociation',
  ACTIVATION: 'Signature',
  REFUS: 'Refus',
  RESILIATION: 'Résiliation',
  EXPIRATION: 'Expiration',
  AJOUT_PIECE: 'Document ajouté',
  RETRAIT_PIECE: 'Document retiré',
};

/** Statuts d’une demande pas encore conclue : un organisme n’en a qu’une à la fois. */
export const STATUTS_EN_COURS: readonly StatutConvention[] = ['DEMANDEE', 'EN_EXAMEN', 'EN_NEGOCIATION'];

export const PIECES_CONVENTION_MAX = 10;
export const POIDS_MAX_PIECE_CONVENTION = 5 * 1024 * 1024;

type Etape = { titre: string; etat: string; avancement: 'fait' | 'en-cours' | 'a-venir' | 'refuse' };

/** Frise d’une convention : demande, examen, négociation, signature ; une fin anticipée remplace l’étape en cours. */
export function etapesConvention(c: Pick<Convention, 'statut' | 'origine'>): Etape[] {
  const rangs: Partial<Record<StatutConvention, number>> = { DEMANDEE: 0, EN_EXAMEN: 1, EN_NEGOCIATION: 2, ACTIVE: 3, EXPIREE: 3, RESILIEE: 3 };
  const titres = ['Demande', 'Examen', 'Négociation', 'Signature'];
  const rang = rangs[c.statut];
  if (rang === undefined) {
    // Refusée ou annulée : on ne sait plus à quelle étape, on montre la clôture.
    return [{ titre: 'Demande', etat: LIBELLES_STATUT_CONVENTION[c.statut].toLowerCase(), avancement: 'refuse' }];
  }
  const etapes: Etape[] = titres.map((titre, i) => ({
    titre, etat: '', avancement: i < rang || (i === rang && rang === 3) ? 'fait' : i === rang ? 'en-cours' : 'a-venir',
  }));
  if (c.statut === 'EXPIREE' || c.statut === 'RESILIEE') {
    etapes.push({ titre: 'Fin', etat: LIBELLES_STATUT_CONVENTION[c.statut].toLowerCase(), avancement: 'refuse' });
  }
  return c.origine === 'ECOLE' ? etapes.slice(2) : etapes;
}

// ----- Accords de stage et de mobilité -----

export type TypeAccord = 'STAGE' | 'MOBILITE';
export type StatutAccord = 'PROPOSE' | 'REFUSE' | 'RETIRE' | 'A_VENIR' | 'ACTIF' | 'TERMINE' | 'RESILIE';
export type ActionAccord =
  | 'PROPOSITION' | 'MODIFICATION' | 'RETRAIT' | 'ACCEPTATION' | 'REFUS' | 'DEBUT' | 'FIN' | 'RESILIATION' | 'RESILIATION_EFFECTIVE'
  | 'AJOUT_PIECE' | 'RETRAIT_PIECE';

export interface Accord {
  id: string;
  organismeId: string;
  organismeNom: string;
  conventionId: string | null;
  conventionObjet: string | null;
  type: TypeAccord;
  /** Partie qui a proposé l’accord ; l’autre y répond. */
  proposePar: OrigineConvention;
  objet: string;
  description: string | null;
  nombrePlaces: number | null;
  filieres: { id: string; nom: string }[];
  dateDebut: string;
  dateFin: string;
  statut: StatutAccord;
  motifDecision: string | null;
  /** Résiliation signalée par l’une des parties : l’accord reste en vigueur jusqu’à `dateEffetResiliation`. */
  resiliationDemandeePar: OrigineConvention | null;
  resiliationDemandeeLe: string | null;
  dateEffetResiliation: string | null;
  /** La personne connectée doit accepter ou refuser. */
  aRepondre: boolean;
  /** La personne connectée l’a proposé et peut encore le corriger ou le retirer. */
  modifiable: boolean;
  /** En vigueur ou à venir, sans résiliation en cours : la personne connectée peut la signaler. */
  resiliable: boolean;
  creeLe: string;
  modifieLe: string;
  pieces: PieceConvention[];
}

/** Préavis de résiliation d’un accord, pour chacune des parties. */
export const PREAVIS_RESILIATION_MOIS = 3;

export interface HistoriqueAccord {
  action: ActionAccord;
  details: string | null;
  motif: string | null;
  auteur: string;
  date: string;
}

export interface AccordRequete {
  organismeId: string | null;
  conventionId: string | null;
  type: TypeAccord;
  objet: string;
  description: string | null;
  nombrePlaces: number | null;
  filiereIds: string[];
  dateDebut: string;
  dateFin: string;
}

export interface CriteresAccords {
  type: TypeAccord | '';
  statut: StatutAccord | '';
  recherche: string;
  aRepondre: boolean;
  page: number;
}

export const STATUTS_ACCORD: readonly StatutAccord[] = ['PROPOSE', 'A_VENIR', 'ACTIF', 'TERMINE', 'RESILIE', 'REFUSE', 'RETIRE'];

export const LIBELLES_TYPE_ACCORD: Record<TypeAccord, string> = { STAGE: 'Stage', MOBILITE: 'Mobilité' };

export const LIBELLES_STATUT_ACCORD: Record<StatutAccord, string> = {
  PROPOSE: 'Proposé',
  REFUSE: 'Refusé',
  RETIRE: 'Retiré',
  A_VENIR: 'À venir',
  ACTIF: 'En vigueur',
  TERMINE: 'Terminé',
  RESILIE: 'Résilié',
};

export const LIBELLES_ACTION_ACCORD: Record<ActionAccord, string> = {
  PROPOSITION: 'Proposition',
  MODIFICATION: 'Proposition corrigée',
  RETRAIT: 'Proposition retirée',
  ACCEPTATION: 'Acceptation',
  REFUS: 'Refus',
  DEBUT: 'Entrée en vigueur',
  FIN: 'Fin de l’accord',
  RESILIATION: 'Résiliation signalée',
  RESILIATION_EFFECTIVE: 'Résiliation effective',
  AJOUT_PIECE: 'Document ajouté',
  RETRAIT_PIECE: 'Document retiré',
};

/** Ton de la pastille : vert en vigueur, or en attente, rouge clos, neutre sinon. */
export function tonAccord(statut: StatutAccord): 'actif' | 'en-cours' | 'clos' | 'neutre' {
  if (statut === 'ACTIF') return 'actif';
  if (statut === 'PROPOSE' || statut === 'A_VENIR') return 'en-cours';
  if (statut === 'REFUSE' || statut === 'RETIRE' || statut === 'RESILIE') return 'clos';
  return 'neutre';
}
