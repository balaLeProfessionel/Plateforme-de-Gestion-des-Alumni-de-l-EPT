import { estTropPetite, FormatRecadrage } from './recadrage';

const TYPES_ACCEPTES = ['image/jpeg', 'image/png'];
const POIDS_MAXIMAL = 5 * 1024 * 1024;

/**
 * Ouvre l'image choisie et vérifie qu'elle peut remplir le format sans devenir floue.
 * Rejette avec un message prêt à afficher.
 */
export async function chargerImagePourRecadrage(fichier: File, format: FormatRecadrage): Promise<HTMLImageElement> {
  if (!TYPES_ACCEPTES.includes(fichier.type)) throw new Error('Choisissez une image JPEG ou PNG.');
  if (fichier.size > POIDS_MAXIMAL) throw new Error('L’image ne doit pas dépasser 5 Mo.');
  const image = new Image();
  image.src = URL.createObjectURL(fichier);
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(image.src);
    throw new Error('Ce fichier ne contient pas une image lisible.');
  }
  if (estTropPetite({ largeur: image.naturalWidth, hauteur: image.naturalHeight }, format)) {
    URL.revokeObjectURL(image.src);
    throw new Error(`L’image est trop petite : au moins ${format.largeurMinimale} × ${format.hauteurMinimale} pixels.`);
  }
  return image;
}
