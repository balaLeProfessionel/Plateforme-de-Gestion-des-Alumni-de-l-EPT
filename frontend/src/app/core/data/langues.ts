import { NiveauLangue } from '../services/models/competences.model';

// Langues proposees, codes ISO 639 (trois lettres pour les langues locales
// qui n'ont pas de code a deux lettres). Le backend accepte tout code ISO :
// une langue lue dans un CV et absente d'ici s'affiche avec son code.
export interface LangueConnue {
  code: string;
  nom: string;
}

export const LANGUES: readonly LangueConnue[] = [
  { code: 'de', nom: 'Allemand' },
  { code: 'am', nom: 'Amharique' },
  { code: 'en', nom: 'Anglais' },
  { code: 'ar', nom: 'Arabe' },
  { code: 'bm', nom: 'Bambara' },
  { code: 'bn', nom: 'Bengali' },
  { code: 'zh', nom: 'Chinois' },
  { code: 'ko', nom: 'Coréen' },
  { code: 'dyo', nom: 'Diola' },
  { code: 'es', nom: 'Espagnol' },
  { code: 'fr', nom: 'Français' },
  { code: 'el', nom: 'Grec' },
  { code: 'ha', nom: 'Haoussa' },
  { code: 'he', nom: 'Hébreu' },
  { code: 'hi', nom: 'Hindi' },
  { code: 'ig', nom: 'Igbo' },
  { code: 'id', nom: 'Indonésien' },
  { code: 'it', nom: 'Italien' },
  { code: 'ja', nom: 'Japonais' },
  { code: 'rw', nom: 'Kinyarwanda' },
  { code: 'ln', nom: 'Lingala' },
  { code: 'ms', nom: 'Malais' },
  { code: 'mg', nom: 'Malgache' },
  { code: 'mnk', nom: 'Mandingue' },
  { code: 'nl', nom: 'Néerlandais' },
  { code: 'ur', nom: 'Ourdou' },
  { code: 'fa', nom: 'Persan' },
  { code: 'ff', nom: 'Peul (pulaar)' },
  { code: 'pl', nom: 'Polonais' },
  { code: 'pt', nom: 'Portugais' },
  { code: 'ro', nom: 'Roumain' },
  { code: 'ru', nom: 'Russe' },
  { code: 'srr', nom: 'Sérère' },
  { code: 'so', nom: 'Somali' },
  { code: 'snk', nom: 'Soninké' },
  { code: 'sv', nom: 'Suédois' },
  { code: 'sw', nom: 'Swahili' },
  { code: 'th', nom: 'Thaï' },
  { code: 'tr', nom: 'Turc' },
  { code: 'uk', nom: 'Ukrainien' },
  { code: 'vi', nom: 'Vietnamien' },
  { code: 'wo', nom: 'Wolof' },
  { code: 'yo', nom: 'Yoruba' }
];

export function nomLangue(code: string): string {
  return LANGUES.find((l) => l.code === code)?.nom ?? code;
}

export const NIVEAUX_LANGUE: readonly { valeur: NiveauLangue; libelle: string }[] = [
  { valeur: 'MATERNELLE', libelle: 'Langue maternelle' },
  { valeur: 'BILINGUE', libelle: 'Bilingue' },
  { valeur: 'COURANT', libelle: 'Courant' },
  { valeur: 'INTERMEDIAIRE', libelle: 'Intermédiaire' },
  { valeur: 'NOTIONS', libelle: 'Notions' }
];

export function libelleNiveau(niveau: string): string {
  return NIVEAUX_LANGUE.find((n) => n.valeur === niveau)?.libelle ?? niveau;
}
