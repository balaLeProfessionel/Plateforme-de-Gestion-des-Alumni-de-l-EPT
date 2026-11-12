/**
 * Page d’un auteur ou d’un organisateur : la fiche de son organisme pour un compte organisme
 * (qui n’a pas de profil personnel), son profil sinon.
 */
export function lienMembre(id: string, organismeId?: string | null): string[] {
  return organismeId ? ['/organismes', organismeId] : ['/profil', id];
}
