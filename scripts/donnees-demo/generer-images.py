"""Illustrations 16:9 (1600 × 900, JPEG) des événements de démonstration.

Visuels abstraits aux couleurs du thème, sans photo de personne réelle. Les noms de fichiers
reprennent les identifiants stables de donnees-demo.sql.
Usage : python generer-images.py <dossier-de-sortie>
"""
import math
import random
import sys
import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ESPACE = uuid.UUID('6f1c2a5e-9a3b-4e7d-8c11-0e9a7d3b2c40')
LARGEUR, HAUTEUR = 1600, 900
THEMES = {
    'forum-2026': ((1, 67, 101), (115, 219, 242)),
    'gala-promo': ((18, 22, 38), (169, 120, 47)),
    'hackathon-ia': ((10, 25, 35), (60, 220, 160)),
    'visite-solaire': ((240, 150, 40), (1, 67, 101)),
    'conf-btp': ((90, 98, 110), (245, 180, 60)),
    'aero-portes': ((25, 90, 160), (230, 240, 250)),
}


def degrade(debut, fin):
    image = Image.new('RGB', (LARGEUR, HAUTEUR))
    pixels = image.load()
    for y in range(HAUTEUR):
        for x in range(0, LARGEUR, 4):
            t = (x / LARGEUR * 0.6 + y / HAUTEUR * 0.4)
            couleur = tuple(int(debut[i] + (fin[i] - debut[i]) * t) for i in range(3))
            for dx in range(4):
                pixels[x + dx, y] = couleur
    return image


def motif(cle, image, accent):
    hasard = random.Random(cle)
    calque = Image.new('RGBA', image.size, (0, 0, 0, 0))
    dessin = ImageDraw.Draw(calque)
    if cle == 'visite-solaire':
        dessin.ellipse((1050, 90, 1350, 390), fill=(255, 220, 120, 230))
        for rangee in range(4):
            for colonne in range(9):
                x, y = 120 + colonne * 150 + rangee * 40, 520 + rangee * 90
                dessin.polygon([(x, y), (x + 130, y), (x + 100, y + 70), (x - 30, y + 70)], fill=(20, 50, 90, 230),
                               outline=(150, 210, 240, 255))
    elif cle == 'conf-btp':
        for i in range(7):
            x = 150 + i * 190
            hauteur = hasard.randint(250, 600)
            dessin.rectangle((x, HAUTEUR - hauteur, x + 140, HAUTEUR), fill=(40, 45, 55, 200))
            for etage in range(HAUTEUR - hauteur + 30, HAUTEUR, 60):
                dessin.rectangle((x + 20, etage, x + 120, etage + 25), fill=(245, 200, 90, 150))
        dessin.line((1250, 120, 1250, 700), fill=accent + (255,), width=18)
        dessin.line((900, 140, 1500, 140), fill=accent + (255,), width=14)
    elif cle == 'aero-portes':
        for i in range(12):
            y = 120 + i * 60
            dessin.arc((-400, y, 2000, y + 900), 200, 340, fill=(255, 255, 255, 40), width=3)
        dessin.polygon([(980, 380), (1380, 330), (1420, 350), (1060, 420)], fill=(255, 255, 255, 235))
        dessin.polygon([(1180, 360), (1260, 250), (1290, 255), (1240, 370)], fill=(255, 255, 255, 235))
        dessin.polygon([(1180, 390), (1250, 470), (1280, 465), (1230, 380)], fill=(255, 255, 255, 235))
    elif cle == 'hackathon-ia':
        for _ in range(140):
            x, y = hasard.randint(0, LARGEUR), hasard.randint(0, HAUTEUR)
            dessin.rectangle((x, y, x + hasard.randint(30, 160), y + 10), fill=accent + (hasard.randint(40, 160),))
        noeuds = [(hasard.randint(700, 1500), hasard.randint(100, 800)) for _ in range(18)]
        for a in noeuds:
            for b in noeuds:
                if a < b and math.dist(a, b) < 300:
                    dessin.line((a, b), fill=accent + (120,), width=3)
        for x, y in noeuds:
            dessin.ellipse((x - 12, y - 12, x + 12, y + 12), fill=accent + (255,))
    elif cle == 'gala-promo':
        for _ in range(260):
            x, y = hasard.randint(0, LARGEUR), hasard.randint(0, HAUTEUR)
            r = hasard.randint(3, 12)
            dessin.ellipse((x - r, y - r, x + r, y + r), fill=accent + (hasard.randint(80, 230),))
        dessin.polygon([(800, 250), (880, 420), (720, 420)], fill=(240, 200, 120, 220))
    else:
        for i in range(14):
            r = 120 + i * 70
            dessin.ellipse((1150 - r, 450 - r, 1150 + r, 450 + r), outline=accent + (90,), width=4)
        for i in range(6):
            dessin.rounded_rectangle((120 + i * 130, 560 - i * 40, 220 + i * 130, 860), radius=10, fill=(255, 255, 255, 60))
    image.paste(calque.filter(ImageFilter.GaussianBlur(0.6)), (0, 0), calque)
    return image


def main():
    sortie = Path(sys.argv[1])
    (sortie / 'evenements').mkdir(parents=True, exist_ok=True)
    for cle, (debut, accent) in THEMES.items():
        image = motif(cle, degrade(debut, tuple(min(255, c + 40) for c in debut)), accent)
        nom = f"{uuid.uuid5(ESPACE, 'evenement/' + cle)}.jpg"
        image.save(sortie / 'evenements' / nom, 'JPEG', quality=86, optimize=True)
        print(nom)


if __name__ == '__main__':
    main()
