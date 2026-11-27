/** Date au format des champs date (fuseau du navigateur), décalée de quelques mois. */
export function dateDans(mois: number): string {
  const jour = new Date();
  jour.setMonth(jour.getMonth() + mois);
  return new Date(jour.getTime() - jour.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** « Java, Spring Boot ; SQL » → ['Java', 'Spring Boot', 'SQL'], sans doublon. */
export function decouper(saisie: string): string[] {
  const vues = new Set<string>();
  return saisie.split(/[,;\n]/).map((c) => c.trim().replace(/\s+/g, ' ')).filter((c) => {
    const cle = c.toLowerCase();
    if (!c || vues.has(cle)) return false;
    vues.add(cle);
    return true;
  });
}
