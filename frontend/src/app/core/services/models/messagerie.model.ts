/** Miroir des réponses de `/api/messagerie` (records Java du paquet `messagerie.dto`). */
export type TypeConversation = 'DIRECTE' | 'GROUPE';
export type RoleParticipant = 'ADMINISTRATEUR' | 'MEMBRE';
/**
 * Puis-je écrire ? Seule une conversation directe se ferme, par un blocage : `J_AI_BLOQUE` (je peux débloquer)
 * ou `FERMEE` (l’autre m’a bloqué, sans que cela me soit dit).
 */
export type EtatEcriture = 'OUVERTE' | 'J_AI_BLOQUE' | 'FERMEE';

/** Longueurs maximales, identiques à celles du serveur. */
export const LONGUEUR_MAX_MESSAGE = 2000;
export const LONGUEUR_MAX_NOM_GROUPE = 80;
export const LONGUEUR_MAX_DESCRIPTION_GROUPE = 500;
export const MEMBRES_MAX_PAR_AJOUT = 50;

/** Pièce jointe : un fichier par message, mêmes limites que `StockagePieceJointe` et `TypePieceJointe`. */
export const TAILLE_MAX_PIECE_JOINTE = 10 * 1024 * 1024;
export const EXTENSIONS_PIECE_JOINTE: readonly string[] =
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'docx', 'xlsx', 'pptx', 'txt'];

/** Fichier joint, décrit sans son contenu ; `image` : affiché dans le fil plutôt que téléchargé. */
export interface PieceJointe {
  nom: string;
  type: string;
  taille: number;
  image: boolean;
}

export interface MembreConversation {
  id: string;
  prenom: string | null;
  nom: string | null;
  nomAffiche: string;
  urlPhoto: string | null;
  role: string;
  roleParticipant: RoleParticipant;
}

export interface ApercuMessage {
  auteurId: string;
  auteurNom: string;
  contenu: string;
  supprime: boolean;
  envoyeLe: string;
}

/** Ligne de la liste : `nom` est celui du groupe ou de l’interlocuteur. */
export interface Conversation {
  id: string;
  type: TypeConversation;
  nom: string;
  interlocuteur: MembreConversation | null;
  /** Photo du groupe ; absente pour une conversation directe. */
  urlPhoto: string | null;
  nombreParticipants: number;
  monRole: RoleParticipant;
  ecriture: EtatEcriture;
  dernierMessage: ApercuMessage | null;
  nombreNonLus: number;
  dernierMessageLe: string;
}

export interface ConversationDetail {
  id: string;
  type: TypeConversation;
  nom: string;
  description: string | null;
  urlPhoto: string | null;
  monRole: RoleParticipant;
  ecriture: EtatEcriture;
  creeLe: string;
  participants: MembreConversation[];
}

/** `contenu` est absent pour un message supprimé ; `deMoi` : écrit par la personne connectée. */
export interface Message {
  id: string;
  auteurId: string;
  auteurNom: string;
  auteurPhoto: string | null;
  contenu: string | null;
  supprime: boolean;
  envoyeLe: string;
  deMoi: boolean;
  pieceJointe: PieceJointe | null;
}

export interface PageMessages {
  messages: Message[];
  plusAnciens: boolean;
}

export interface PageConversations {
  contenu: Conversation[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

/** Champs modifiés d’un groupe ; un champ absent reste tel quel, une description vide l’efface. */
export interface ModificationGroupe {
  nom?: string;
  description?: string;
}

/** Membre que j’ai bloqué. */
export interface MembreBloque {
  id: string;
  prenom: string | null;
  nom: string | null;
  nomAffiche: string;
  urlPhoto: string | null;
  role: string;
  bloqueLe: string;
}

/** Membre choisi dans la recherche, avant de l’ajouter à une conversation. */
export interface MembreChoisi {
  id: string;
  prenom: string | null;
  nom: string;
  role: string;
  urlPhoto: string | null;
}
