/** Fuseau de l’école, celui du serveur pour « aujourd’hui » et la durée maximale d’une offre. */
const FUSEAU_ECOLE = 'Africa/Dakar';

/**
 * Date au format des champs date, décalée de quelques mois, calculée comme le serveur : « aujourd’hui » à Dakar, et un
 * jour absent du mois cible ramené à son dernier jour (31 août + 6 mois = 28 février, comme Java plusMonths).
 */
export function dateDans(mois: number, maintenant = new Date()): string {
  const parties = new Intl.DateTimeFormat('en-US', { timeZone: FUSEAU_ECOLE, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(maintenant);
  const valeur = (type: Intl.DateTimeFormatPartTypes) => Number(parties.find((p) => p.type === type)?.value);
  const cible = valeur('month') - 1 + mois;
  const annee = valeur('year') + Math.floor(cible / 12);
  const indiceMois = ((cible % 12) + 12) % 12;
  const dernierJour = new Date(Date.UTC(annee, indiceMois + 1, 0)).getUTCDate();
  const deuxChiffres = (n: number) => String(n).padStart(2, '0');
  return `${annee}-${deuxChiffres(indiceMois + 1)}-${deuxChiffres(Math.min(valeur('day'), dernierJour))}`;
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
