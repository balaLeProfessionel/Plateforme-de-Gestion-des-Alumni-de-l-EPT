/** Miroir des réponses de `/api/messagerie` (records Java du paquet `messagerie.dto`). */
export type TypeConversation = 'DIRECTE' | 'GROUPE';
export type RoleParticipant = 'ADMINISTRATEUR' | 'MEMBRE';

/** Longueurs maximales, identiques à celles du serveur. */
export const LONGUEUR_MAX_MESSAGE = 2000;
export const LONGUEUR_MAX_NOM_GROUPE = 80;
export const MEMBRES_MAX_PAR_AJOUT = 50;

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
  nombreParticipants: number;
  monRole: RoleParticipant;
  dernierMessage: ApercuMessage | null;
  nombreNonLus: number;
  dernierMessageLe: string;
}

export interface ConversationDetail {
  id: string;
  type: TypeConversation;
  nom: string;
  monRole: RoleParticipant;
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

/** Membre choisi dans la recherche, avant de l’ajouter à une conversation. */
export interface MembreChoisi {
  id: string;
  prenom: string | null;
  nom: string;
  role: string;
  urlPhoto: string | null;
}
