import { EXTENSIONS_PIECE_JOINTE, TAILLE_MAX_PIECE_JOINTE } from '../../../core/services/models/messagerie.model';

/** Valeur de l’attribut `accept` du sélecteur de fichier. */
export const ACCEPT_PIECE_JOINTE = EXTENSIONS_PIECE_JOINTE.map((extension) => `.${extension}`).join(',');

/**
 * Contrôle immédiat, avant tout envoi : extension acceptée et taille. Le serveur refait ces contrôles
 * et vérifie en plus le contenu du fichier ; son message d’erreur prime.
 */
export function verifierPieceJointe(fichier: File): string | null {
  const point = fichier.name.lastIndexOf('.');
  const extension = point < 0 ? '' : fichier.name.slice(point + 1).toLowerCase();
  if (!EXTENSIONS_PIECE_JOINTE.includes(extension)) {
    return 'Ce type de fichier n’est pas accepté : image (JPEG, PNG, GIF, WebP), PDF, Word, Excel, PowerPoint ou texte.';
  }
  if (fichier.size === 0) return 'Le fichier choisi est vide.';
  if (fichier.size > TAILLE_MAX_PIECE_JOINTE) return 'Le fichier joint ne doit pas dépasser 10 Mo.';
  return null;
}

/** « 850 o », « 12 Ko », « 3,4 Mo » : à la française, une décimale au plus. */
export function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  const [valeur, unite] = octets < 1024 * 1024 ? [octets / 1024, 'Ko'] : [octets / (1024 * 1024), 'Mo'];
  const chiffres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: valeur < 10 ? 1 : 0 }).format(valeur);
  return `${chiffres} ${unite}`;
}
