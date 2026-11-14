import { Conversation } from '../../core/services/models/messagerie.model';

/**
 * Aperçu du dernier message sous le nom d’une conversation : préfixé par « Vous » quand il est de moi,
 * par le nom de l’auteur dans un groupe (dans une conversation directe, l’auteur est évident).
 */
export function apercuConversation(conversation: Conversation, moiId: string | undefined): string {
  const dernier = conversation.dernierMessage;
  if (!dernier) return conversation.type === 'GROUPE' ? 'Groupe créé, aucun message' : 'Aucun message pour l’instant';
  const texte = dernier.supprime ? 'Message supprimé' : dernier.contenu;
  if (dernier.auteurId === moiId) return `Vous : ${texte}`;
  return conversation.type === 'GROUPE' ? `${dernier.auteurNom} : ${texte}` : texte;
}
