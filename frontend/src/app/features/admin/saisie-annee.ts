/** Années saisies au clavier : vide accepté, sinon quatre chiffres plausibles. */
export function anneeOuNull(saisie: string): number | null {
  const texte = saisie.trim();
  return texte ? Number(texte) : null;
}

export function erreurAnnee(saisie: string, apres?: string): { kind: string; message: string } | undefined {
  const texte = saisie.trim();
  if (!texte) return undefined;
  if (!/^\d{4}$/.test(texte) || Number(texte) < 1975) return { kind: 'annee', message: 'Indiquez une année sur quatre chiffres.' };
  const debut = apres?.trim();
  if (debut && /^\d{4}$/.test(debut) && Number(texte) < Number(debut)) {
    return { kind: 'ordre', message: 'L’année de sortie ne peut pas précéder l’année d’entrée.' };
  }
  return undefined;
}
