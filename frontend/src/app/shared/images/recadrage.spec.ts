import {
  cadreMaximal,
  contraindre,
  deplacer,
  estPetite,
  estTropPetite,
  etatInitial,
  FORMAT_EVENEMENT,
  FORMAT_PHOTO_PROFIL,
  styleApercu,
  zoneSource,
  zoomMaximal,
} from './recadrage';

describe('Calcul du recadrage', () => {
  const paysage = { largeur: 3200, hauteur: 1200 };
  const portrait = { largeur: 1200, hauteur: 2000 };

  it('prend le plus grand cadre 16:9 qui tient dans l’image', () => {
    const large = cadreMaximal(paysage, FORMAT_EVENEMENT);
    expect(large.largeur).toBeCloseTo(1200 * 16 / 9);
    expect(large.hauteur).toBe(1200);
    const haut = cadreMaximal(portrait, FORMAT_EVENEMENT);
    expect(haut.largeur).toBe(1200);
    expect(haut.hauteur).toBeCloseTo(1200 * 9 / 16);
    expect(cadreMaximal(portrait, FORMAT_PHOTO_PROFIL)).toEqual({ largeur: 1200, hauteur: 1200 });
  });

  it('centre le cadre au départ', () => {
    const zone = zoneSource(etatInitial(paysage), paysage, FORMAT_EVENEMENT);
    expect(zone.x + zone.largeur / 2).toBe(1600);
    expect(zone.y).toBe(0);
    expect(zone.largeur / zone.hauteur).toBeCloseTo(16 / 9);
  });

  it('borne le zoom pour que la zone reste plus grande que le minimum exigé', () => {
    expect(zoomMaximal(paysage, FORMAT_EVENEMENT)).toBeCloseTo(1200 / 450);
    expect(zoomMaximal({ largeur: 800, hauteur: 450 }, FORMAT_EVENEMENT)).toBe(1);
    expect(zoomMaximal({ largeur: 8000, hauteur: 8000 }, FORMAT_PHOTO_PROFIL)).toBe(4);
    expect(contraindre({ ...etatInitial(paysage), zoom: 10 }, paysage, FORMAT_EVENEMENT).zoom).toBeCloseTo(1200 / 450);
    expect(contraindre({ ...etatInitial(paysage), zoom: 0.2 }, paysage, FORMAT_EVENEMENT).zoom).toBe(1);
  });

  it('ne laisse jamais le cadre sortir de l’image', () => {
    const hors = contraindre({ centreX: -500, centreY: 99_999, zoom: 1 }, paysage, FORMAT_EVENEMENT);
    const zone = zoneSource(hors, paysage, FORMAT_EVENEMENT);
    expect(zone.x).toBe(0);
    expect(zone.y).toBe(0);
    expect(zone.x + zone.largeur).toBeLessThanOrEqual(paysage.largeur);
  });

  it('convertit un glissement à l’écran en déplacement dans l’image, en sens naturel', () => {
    const depart = etatInitial(paysage);
    const cadre = cadreMaximal(paysage, FORMAT_EVENEMENT);
    // Le cadre affiché fait 400 px : 1 px à l'écran = largeur du cadre / 400 px de l'image.
    const apres = deplacer(depart, 100, 0, 400, paysage, FORMAT_EVENEMENT);
    expect(apres.centreX).toBeCloseTo(depart.centreX - 100 * cadre.largeur / 400);
    expect(apres.centreY).toBe(depart.centreY);
  });

  it('positionne l’aperçu en pourcentages du cadre', () => {
    const style = styleApercu(etatInitial(paysage), paysage, FORMAT_EVENEMENT);
    const cadre = cadreMaximal(paysage, FORMAT_EVENEMENT);
    expect(style.largeur).toBeCloseTo(paysage.largeur / cadre.largeur * 100);
    expect(style.gauche).toBeCloseTo(-((paysage.largeur - cadre.largeur) / 2) / cadre.largeur * 100);
    expect(style.haut).toBe(-0);
  });

  it('refuse une source plus petite que le minimum du format', () => {
    expect(estTropPetite({ largeur: 399, hauteur: 900 }, FORMAT_EVENEMENT)).toBe(true);
    expect(estTropPetite({ largeur: 400, hauteur: 225 }, FORMAT_EVENEMENT)).toBe(false);
    expect(estTropPetite({ largeur: 300, hauteur: 199 }, FORMAT_PHOTO_PROFIL)).toBe(true);
  });

  it('signale une source acceptée mais sous la taille conseillée', () => {
    expect(estPetite({ largeur: 640, hauteur: 360 }, FORMAT_EVENEMENT)).toBe(true);
    expect(estPetite({ largeur: 800, hauteur: 450 }, FORMAT_EVENEMENT)).toBe(false);
  });
});
