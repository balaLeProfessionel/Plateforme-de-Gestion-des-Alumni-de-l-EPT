"""Portraits illustrés, logos d'organismes et visuels d'événements des données de démonstration étendues.

Aucune photo de personne réelle : des portraits dessinés (teint, coiffure, foulard, lunettes, tenue
tirés au hasard de façon reproductible), des logos à initiales et des visuels abstraits 16:9.
Les noms de fichiers reprennent les identifiants stables de donnees-demo-etendues.sql.
Usage : python generer-visuels.py <dossier-de-sortie> <liste.json>
"""
import importlib.util
import json
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

COTE = 600
TEINTS = [(74, 46, 31), (92, 58, 38), (110, 70, 45), (128, 84, 55), (146, 98, 66), (170, 122, 86), (206, 160, 120), (232, 196, 160)]
FONDS = [(227, 238, 243), (243, 232, 214), (222, 240, 232), (236, 230, 245), (250, 236, 231), (232, 240, 250), (240, 240, 232)]
TENUES = [(1, 67, 101), (30, 41, 59), (169, 120, 47), (13, 110, 86), (153, 60, 29), (83, 74, 183), (220, 220, 225), (60, 60, 60), (115, 219, 242)]
FOULARDS = [(169, 120, 47), (153, 60, 29), (13, 110, 86), (83, 74, 183), (212, 83, 126), (1, 67, 101), (186, 117, 23)]
CHEVEUX = [(20, 16, 14), (35, 26, 20), (55, 40, 30), (90, 70, 50)]


def assombrir(couleur, facteur):
    return tuple(max(0, int(c * facteur)) for c in couleur)


def portrait(graine, feminin):
    h = random.Random(graine)
    fond, teint, tenue = h.choice(FONDS), h.choice(TEINTS[:6] if h.random() < 0.9 else TEINTS), h.choice(TENUES)
    image = Image.new('RGB', (COTE, COTE), fond)
    d = ImageDraw.Draw(image)
    # Halo discret derrière la tête.
    d.ellipse((90, 40, 510, 460), fill=tuple(min(255, c + 8) for c in fond))
    # Épaules et tenue.
    d.rounded_rectangle((70, 450, 530, 760), radius=170, fill=tenue)
    col = tuple(min(255, c + 60) for c in tenue) if sum(tenue) < 300 else assombrir(tenue, 0.75)
    if h.random() < 0.5:
        d.polygon([(250, 452), (300, 535), (350, 452)], fill=col)
    else:
        d.ellipse((240, 440, 360, 500), fill=col)
    # Cou et tête.
    d.rounded_rectangle((255, 360, 345, 470), radius=30, fill=assombrir(teint, 0.9))
    visage = (185, 140, 415, 420)
    d.ellipse((172, 255, 205, 320), fill=teint)
    d.ellipse((395, 255, 428, 320), fill=teint)
    d.ellipse(visage, fill=teint)

    cheveux = h.choice(CHEVEUX)
    foulard = feminin and h.random() < 0.45
    if foulard:
        tissu = h.choice(FOULARDS)
        d.ellipse((160, 95, 440, 300), fill=tissu)
        d.rectangle((168, 200, 432, 260), fill=tissu)
        d.ellipse((205, 70, 395, 170), fill=assombrir(tissu, 0.85))
        d.ellipse((185, 165, 415, 230), fill=teint)
    elif feminin:
        style = h.choice(['chignon', 'tresses', 'court'])
        if style == 'chignon':
            d.ellipse((240, 60, 360, 150), fill=cheveux)
        if style == 'tresses':
            d.rounded_rectangle((165, 190, 215, 470), radius=25, fill=cheveux)
            d.rounded_rectangle((385, 190, 435, 470), radius=25, fill=cheveux)
        d.chord((180, 120, 420, 330), 180, 360, fill=cheveux)
        d.ellipse((182, 175, 300, 245), fill=cheveux)
    else:
        style = h.choice(['ras', 'court', 'court', 'kufi', 'degarni'])
        if style == 'kufi':
            calotte = h.choice([(245, 245, 240), (1, 67, 101), (169, 120, 47), (30, 41, 59)])
            d.chord((190, 110, 410, 270), 180, 360, fill=calotte)
            d.rectangle((190, 185, 410, 200), fill=calotte)
        elif style != 'degarni':
            d.chord((186, 128, 414, 300), 180, 360, fill=cheveux if style == 'court' else assombrir(teint, 0.55))
        else:
            d.arc((185, 140, 415, 330), 190, 350, fill=cheveux, width=12)
        if h.random() < 0.35:
            d.chord((215, 300, 385, 440), 0, 180, fill=cheveux)
            d.ellipse((240, 300, 360, 400), fill=teint)

    # Traits du visage.
    trait = assombrir(teint, 0.45)
    d.line((235, 262, 275, 255), fill=trait, width=6)
    d.line((325, 255, 365, 262), fill=trait, width=6)
    for x in (255, 345):
        d.ellipse((x - 13, 280, x + 13, 300), fill=(250, 250, 248))
        d.ellipse((x - 7, 283, x + 7, 297), fill=(28, 22, 20))
    d.line((300, 300, 292, 345), fill=assombrir(teint, 0.7), width=5)
    d.arc((262, 330, 338, 385), 20, 160, fill=assombrir(teint, 0.4), width=6)
    if h.random() < 0.25:
        monture = h.choice([(20, 20, 20), (120, 80, 40), (1, 67, 101)])
        d.rounded_rectangle((222, 268, 288, 312), radius=14, outline=monture, width=6)
        d.rounded_rectangle((312, 268, 378, 312), radius=14, outline=monture, width=6)
        d.line((288, 288, 312, 288), fill=monture, width=5)
    return image.filter(ImageFilter.SMOOTH)


def logo(graine, nom):
    h = random.Random(graine)
    principale = h.choice([(1, 67, 101), (13, 110, 86), (153, 60, 29), (83, 74, 183), (30, 41, 59), (169, 120, 47)])
    image = Image.new('RGB', (COTE, COTE), (250, 250, 248))
    d = ImageDraw.Draw(image)
    d.rounded_rectangle((60, 60, 540, 540), radius=110, fill=principale)
    clair = tuple(min(255, c + 90) for c in principale)
    forme = h.choice(['cercles', 'vague', 'triangle'])
    if forme == 'cercles':
        for r in (200, 150, 100):
            d.ellipse((300 - r, 300 - r, 300 + r, 300 + r), outline=clair, width=14)
    elif forme == 'vague':
        for i in range(4):
            d.arc((40, 160 + i * 60, 560, 520 + i * 60), 200, 340, fill=clair, width=16)
    else:
        d.polygon([(300, 130), (470, 440), (130, 440)], outline=clair, width=16)
    initiales = ''.join(mot[0] for mot in nom.replace('’', ' ').split() if mot[0].isupper())[:2] or nom[:2].upper()
    from PIL import ImageFont
    try:
        police = ImageFont.truetype('arialbd.ttf', 190)
    except OSError:
        police = ImageFont.load_default(190)
    boite = d.textbbox((0, 0), initiales, font=police)
    d.text((300 - (boite[2] - boite[0]) / 2 - boite[0], 300 - (boite[3] - boite[1]) / 2 - boite[1]), initiales,
           fill=(255, 255, 255), font=police)
    return image


def visuels_evenements():
    chemin = Path(__file__).with_name('generer-images.py')
    spec = importlib.util.spec_from_file_location('generer_images', chemin)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    sortie = Path(sys.argv[1])
    liste = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
    (sortie / 'evenements').mkdir(parents=True, exist_ok=True)
    for element in liste['portraits']:
        portrait(element['id'], element['feminin']).save(sortie / element['fichier'], 'JPEG', quality=88, optimize=True)
    for element in liste['logos']:
        logo(element['id'], element['nom']).save(sortie / element['fichier'], 'JPEG', quality=90, optimize=True)
    module = visuels_evenements()
    for element in liste['evenements']:
        debut, accent = element['couleurs']
        base = module.degrade(tuple(debut), tuple(min(255, c + 40) for c in debut))
        module.motif(element['motif'], base, tuple(accent)).save(
            sortie / 'evenements' / element['fichier'], 'JPEG', quality=86, optimize=True)
    print(len(liste['portraits']), 'portraits,', len(liste['logos']), 'logos,', len(liste['evenements']), 'visuels')


if __name__ == '__main__':
    main()
