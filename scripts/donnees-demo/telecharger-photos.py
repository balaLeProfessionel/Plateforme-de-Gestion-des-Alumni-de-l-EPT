"""Télécharge les photos libres de droits de photos-libres.json et prépare leur rattachement en base.

- Chaque photo est recadrée comme dans l'application : 4:5 pour une publication du fil, 16:9 pour une
  couverture d'article ou un événement, puis écrite à son
  chemin final sous <dossier-de-sortie> (evenements/<id>.jpg ou publications/<id>.png).
- Un cache local (.cache-photos/, ignoré par Git) évite de retélécharger à chaque chargement.
- <dossier-de-sortie>/photos-libres.sql rattache les images aux publications et aux événements de
  démonstration qui n'en ont pas encore (les articles reçoivent la leur dans donnees-demo-articles.sql).

Usage : python telecharger-photos.py <dossier-de-sortie>
"""
import io
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from PIL import Image, ImageOps

import photos_libres

AGENT = "EPT-Alumni-donnees-demo/1.0 (script local de developpement, projet etudiant)"
CACHE = Path(__file__).with_name(".cache-photos")
# Formats de recadrage de l'application (FORMAT_PUBLICATION 4:5, FORMAT_EVENEMENT 16:9).
FORMAT_PUBLICATION, FORMAT_PAYSAGE = (576, 720), (1280, 720)
# Espace des identifiants de generer-sql-publications.py.
ESPACE_PUBLICATIONS = uuid.UUID("5d0c1e4a-7f3b-4c55-9a51-2f6a0f1b9e01")


def telecharger(cible, photo):
    """Miniature standard de 1 280 px servie par le CDN de Wikimedia (adresse donnée par son API, notée dans
    photos-libres.json) : Wikimedia demande de ne pas faire générer d'autres tailles ni de lire les originaux."""
    fichier = CACHE / (photos_libres.identifiant_stockage(cible) + ".img")
    if not fichier.exists():
        for essai in range(5):
            try:
                req = urllib.request.Request(photo["miniature"], headers={"User-Agent": AGENT})
                with urllib.request.urlopen(req, timeout=60) as reponse:
                    fichier.write_bytes(reponse.read())
                break
            except urllib.error.HTTPError as erreur:
                if essai == 4 or erreur.code not in (429, 500, 502, 503, 504):
                    raise
                attente = erreur.headers.get("Retry-After", "")
                time.sleep(int(attente) if attente.isdigit() else 15 * (essai + 1))
            except urllib.error.URLError:
                if essai == 4:
                    raise
                time.sleep(10 * (essai + 1))
        time.sleep(1)
    return Image.open(io.BytesIO(fichier.read_bytes()))


def q(valeur):
    return "'" + valeur.replace("'", "''") + "'"


def main(sortie):
    sortie = Path(sortie)
    CACHE.mkdir(exist_ok=True)
    photos = photos_libres.charger()
    sql = ["-- Généré par telecharger-photos.py : images libres de droits des données de démonstration.", "begin;"]
    for cible, photo in photos.items():
        taille = FORMAT_PUBLICATION if cible.startswith("publication:") else FORMAT_PAYSAGE
        image = ImageOps.fit(ImageOps.exif_transpose(telecharger(cible, photo)).convert("RGB"), taille,
                             Image.Resampling.LANCZOS, centering=tuple(photo.get("centrage", (0.5, 0.5))))
        destination = sortie / photos_libres.chemin(cible)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.suffix == ".png":
            image.save(destination, "PNG", optimize=True)
        else:
            image.save(destination, "JPEG", quality=86, optimize=True)
        genre, cle = cible.split(":", 1)
        if genre == "publication":
            pid = uuid.uuid5(ESPACE_PUBLICATIONS, f"publication/{cle}")
            sql.append(f"update publications set url_image = 'stockage:{photos_libres.identifiant_stockage(cible)}', "
                       f"texte_alternatif = {q(photo['alt'])} where id = '{pid}' and url_image is null;")
        elif genre.startswith("evenement"):
            eid = Path(photos_libres.chemin(cible)).stem
            sql.append(f"update evenements set url_image = '/api/evenement-images/{eid}.jpg' "
                       f"where id = '{eid}' and url_image is null;")
        print(cible)
    sql.append("commit;")
    (sortie / "photos-libres.sql").write_text("\n".join(sql) + "\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main(sys.argv[1])
