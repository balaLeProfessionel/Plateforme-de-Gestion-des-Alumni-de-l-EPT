/** Format imposé à une image : rapport du cadre, taille produite et taille minimale de la source. */
export interface FormatRecadrage {
  largeur: number;
  hauteur: number;
  largeurMinimale: number;
  hauteurMinimale: number;
}

/** Mêmes formats que le serveur (`FormatImage`). */
export const FORMAT_EVENEMENT: FormatRecadrage = { largeur: 1600, hauteur: 900, largeurMinimale: 800, hauteurMinimale: 450 };
export const FORMAT_PHOTO_PROFIL: FormatRecadrage = { largeur: 600, hauteur: 600, largeurMinimale: 200, hauteurMinimale: 200 };

export interface Dimensions {
  largeur: number;
  hauteur: number;
}

/**
 * Position du cadre dans l'image source : centre (en pixels de l'image) et zoom (1 = le cadre
 * le plus grand possible). Le cadre reste toujours entièrement dans l'image : jamais de bord vide.
 */
export interface EtatRecadrage {
  centreX: number;
  centreY: number;
  zoom: number;
}

export interface ZoneSource {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

export function estTropPetite(image: Dimensions, format: FormatRecadrage): boolean {
  return image.largeur < format.largeurMinimale || image.hauteur < format.hauteurMinimale;
}

/** Plus grand cadre au rapport du format qui tient dans l'image (zoom 1). */
export function cadreMaximal(image: Dimensions, format: FormatRecadrage): Dimensions {
  const rapport = format.largeur / format.hauteur;
  return image.largeur / image.hauteur > rapport
    ? { largeur: image.hauteur * rapport, hauteur: image.hauteur }
    : { largeur: image.largeur, hauteur: image.largeur / rapport };
}

/** Zoom maximal : au-delà, le cadre couvrirait moins de pixels que le minimum, l'image deviendrait floue. */
export function zoomMaximal(image: Dimensions, format: FormatRecadrage): number {
  const cadre = cadreMaximal(image, format);
  return Math.max(1, Math.min(4, cadre.largeur / format.largeurMinimale, cadre.hauteur / format.hauteurMinimale));
}

export function etatInitial(image: Dimensions): EtatRecadrage {
  return { centreX: image.largeur / 2, centreY: image.hauteur / 2, zoom: 1 };
}

/** Ramène le zoom dans ses bornes et le centre là où le cadre reste dans l'image. */
export function contraindre(etat: EtatRecadrage, image: Dimensions, format: FormatRecadrage): EtatRecadrage {
  const zoom = Math.min(zoomMaximal(image, format), Math.max(1, etat.zoom));
  const cadre = cadreMaximal(image, format);
  const demiLargeur = cadre.largeur / zoom / 2;
  const demiHauteur = cadre.hauteur / zoom / 2;
  return {
    zoom,
    centreX: Math.min(image.largeur - demiLargeur, Math.max(demiLargeur, etat.centreX)),
    centreY: Math.min(image.hauteur - demiHauteur, Math.max(demiHauteur, etat.centreY)),
  };
}

/** Rectangle de l'image source à copier dans le cadre (pour `drawImage`). */
export function zoneSource(etat: EtatRecadrage, image: Dimensions, format: FormatRecadrage): ZoneSource {
  const cadre = cadreMaximal(image, format);
  const largeur = cadre.largeur / etat.zoom;
  const hauteur = cadre.hauteur / etat.zoom;
  return { x: etat.centreX - largeur / 2, y: etat.centreY - hauteur / 2, largeur, hauteur };
}

/**
 * Déplace l'image d'un glissement mesuré à l'écran : faire glisser vers la droite montre la
 * partie gauche de l'image, comme sur un téléphone.
 */
export function deplacer(
  etat: EtatRecadrage, deltaEcranX: number, deltaEcranY: number, largeurCadreEcran: number,
  image: Dimensions, format: FormatRecadrage,
): EtatRecadrage {
  const pixelsParPoint = zoneSource(etat, image, format).largeur / largeurCadreEcran;
  return contraindre(
    { ...etat, centreX: etat.centreX - deltaEcranX * pixelsParPoint, centreY: etat.centreY - deltaEcranY * pixelsParPoint },
    image, format);
}

/** Position et taille de l'image dans le cadre affiché, en pourcentages du cadre (pas de mesure nécessaire). */
export function styleApercu(etat: EtatRecadrage, image: Dimensions, format: FormatRecadrage) {
  const zone = zoneSource(etat, image, format);
  return {
    largeur: (image.largeur / zone.largeur) * 100,
    gauche: (-zone.x / zone.largeur) * 100,
    haut: (-zone.y / zone.hauteur) * 100,
  };
}
