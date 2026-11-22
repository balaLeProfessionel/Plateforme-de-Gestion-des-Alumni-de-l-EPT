import { HttpErrorResponse } from '@angular/common/http';

/**
 * Message à montrer après un appel refusé : celui du serveur (`{"message": "…"}`, en français) quand il a répondu,
 * sinon le texte par défaut. Sans réseau (statut 0), `error` est l’erreur technique du navigateur
 * (« Failed to fetch ») : elle ne doit jamais s’afficher.
 */
export function messageServeur(erreur: unknown, parDefaut: string): string {
  if (erreur instanceof HttpErrorResponse && erreur.status > 0) {
    const corps: unknown = erreur.error;
    const message = corps && typeof corps === 'object' && 'message' in corps ? corps.message : null;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return parDefaut;
}
