import { LigneImport } from '../../../core/services/models/admin.model';

/** Une ligne lue dans le fichier, avec ce qui cloche avant même l’envoi. */
export interface LigneLue extends LigneImport {
  numero: number;
  probleme: string | null;
}

export interface LectureCsv {
  lignes: LigneLue[];
  erreur: string | null;
}

const COLONNES: Record<string, keyof LigneImport> = {
  prenom: 'prenom', prenoms: 'prenom', nom: 'nom', email: 'email', mail: 'email', courriel: 'email', adresse: 'email',
  filiere: 'filiere', anneeentree: 'anneeEntree', entree: 'anneeEntree', anneesortie: 'anneeSortie', sortie: 'anneeSortie',
  promotion: 'anneeSortie',
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LIGNES_MAX = 300;

/** Modèle proposé au téléchargement, lisible par un tableur français (séparateur point-virgule). */
export const MODELE_CSV = 'prenom;nom;email;filiere;annee_entree\nAwa;Diop;awa.diop@ept.sn;Génie informatique et télécommunications;2026\n';

/**
 * Lit un fichier de promotion exporté d’un tableur : première ligne d’en-têtes (ordre libre, accents et
 * majuscules ignorés), séparateur « ; » ou « , », champs éventuellement entre guillemets.
 */
export function lireCsvComptes(texte: string): LectureCsv {
  const lignesTexte = texte.replace(/^\uFEFF/, '').split(/\r?\n/).filter((ligne) => ligne.trim() !== '');
  if (lignesTexte.length < 2) return { lignes: [], erreur: 'Le fichier doit contenir une ligne d’en-têtes puis au moins un compte.' };
  const separateur = (lignesTexte[0].match(/;/g)?.length ?? 0) >= (lignesTexte[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const entetes = decouper(lignesTexte[0], separateur).map((entete) => COLONNES[normaliser(entete)] ?? null);
  const manquantes = (['prenom', 'nom', 'email'] as const).filter((colonne) => !entetes.includes(colonne));
  if (manquantes.length) {
    return { lignes: [], erreur: 'Colonnes obligatoires absentes : ' + manquantes.map((c) => ({ prenom: 'prénom', nom: 'nom', email: 'e-mail' })[c]).join(', ') + '.' };
  }
  if (lignesTexte.length - 1 > LIGNES_MAX) return { lignes: [], erreur: `${LIGNES_MAX} comptes au plus par import : découpez le fichier.` };

  const lignes = lignesTexte.slice(1).map((texteLigne, index) => {
    const valeurs = decouper(texteLigne, separateur);
    const brut: Record<string, string> = {};
    entetes.forEach((colonne, i) => { if (colonne) brut[colonne] = (valeurs[i] ?? '').trim(); });
    const ligne: LigneLue = {
      numero: index + 1,
      prenom: brut['prenom'] ?? '', nom: brut['nom'] ?? '', email: (brut['email'] ?? '').toLowerCase(),
      filiere: brut['filiere'] || null, anneeEntree: annee(brut['anneeEntree']), anneeSortie: annee(brut['anneeSortie']),
      probleme: null,
    };
    ligne.probleme = !ligne.prenom || !ligne.nom ? 'Prénom ou nom manquant.'
      : !EMAIL.test(ligne.email) ? 'Adresse e-mail invalide.'
      : (brut['anneeEntree'] && ligne.anneeEntree === null) || (brut['anneeSortie'] && ligne.anneeSortie === null) ? 'Année invalide.'
      : null;
    return ligne;
  });
  const vues = new Set<string>();
  for (const ligne of lignes) {
    if (!ligne.probleme && vues.has(ligne.email)) ligne.probleme = 'Adresse en double dans le fichier.';
    vues.add(ligne.email);
  }
  return { lignes, erreur: null };
}

function decouper(ligne: string, separateur: string): string[] {
  const valeurs: string[] = [];
  let courante = '';
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const caractere = ligne[i];
    if (caractere === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') { courante += '"'; i++; } else entreGuillemets = !entreGuillemets;
    } else if (caractere === separateur && !entreGuillemets) {
      valeurs.push(courante);
      courante = '';
    } else {
      courante += caractere;
    }
  }
  valeurs.push(courante);
  return valeurs;
}

function normaliser(entete: string): string {
  return entete.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
}

function annee(valeur: string | undefined): number | null {
  return valeur && /^\d{4}$/.test(valeur) ? Number(valeur) : null;
}
