import { Conversation } from '../../core/services/models/messagerie.model';

/** Le serveur écrit le départ avec ce texte (`MessagesSysteme.DEPART`) ; l’arrivée avec « a rejoint la communauté. ». */
export const TEXTE_DEPART = 'a quitté la communauté.';

/**
 * Message du système précédé de son auteur : « Awa Diop a quitté la communauté. », « Vous avez rejoint la communauté. ».
 * Le serveur écrit « a … » ; pour moi, il devient « Vous avez … ».
 */
export function texteSysteme(contenu: string | null, auteurNom: string, deMoi: boolean): string {
  const texte = contenu ?? '';
  return deMoi ? `Vous avez ${texte.replace(/^a /, '')}` : `${auteurNom} ${texte}`;
}

/**
 * Aperçu du dernier message sous le nom d’une conversation : préfixé par « Vous » quand il est de moi,
 * par le nom de l’auteur dans un groupe (dans une conversation directe, l’auteur est évident).
 */
export function apercuConversation(conversation: Conversation, moiId: string | undefined): string {
  const dernier = conversation.dernierMessage;
  if (!dernier) {
    if (conversation.categorie) return 'Aucun message pour l’instant';
    return conversation.type === 'GROUPE' ? 'Groupe créé, aucun message' : 'Aucun message pour l’instant';
  }
  // Message du système : « Awa Diop a rejoint la communauté. »
  if (dernier.systeme) return texteSysteme(dernier.contenu, dernier.auteurNom, dernier.auteurId === moiId);
  const texte = dernier.supprime ? 'Message supprimé' : dernier.contenu;
  if (dernier.auteurId === moiId) return `Vous : ${texte}`;
  return conversation.type === 'GROUPE' ? `${dernier.auteurNom} : ${texte}` : texte;
}
