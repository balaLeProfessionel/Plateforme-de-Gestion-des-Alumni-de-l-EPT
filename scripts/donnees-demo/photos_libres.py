"""Photos libres de droits (CC0 ou domaine public) des données de démonstration.

La liste est dans photos-libres.json : pour chaque cible (« publication:<clé> », « article:<clé> »,
« evenement:<clé> », « evenement-etendu:<numéro> »), l'adresse de l'image sur Wikimedia Commons et de sa miniature de 1 280 px, sa page,
son auteur, sa licence et un texte alternatif. Les générateurs SQL lisent cette liste pour savoir quelles
publications, quels articles et quels événements ont une image ; telecharger-photos.py la télécharge.
"""
import json
import uuid
from pathlib import Path

MANIFESTE = Path(__file__).with_name("photos-libres.json")
# Espace des identifiants de generer-sql.py et generer-sql-etendu.py (événements).
ESPACE_EVENEMENTS = uuid.UUID("6f1c2a5e-9a3b-4e7d-8c11-0e9a7d3b2c40")
ESPACE_PHOTOS = uuid.UUID("0b8e3d52-6c1f-4a9e-b7d4-3e5f2a1c9d70")


def charger():
    """{cible: {url, page, auteur, licence, alt}}"""
    return json.loads(MANIFESTE.read_text(encoding="utf-8"))


def identifiant_stockage(cible):
    """Identifiant de l'image d'une publication ou d'un article (fichier publications/<id>.png)."""
    return str(uuid.uuid5(ESPACE_PHOTOS, cible))


def chemin(cible):
    """Chemin du fichier sous le dossier des photos de l'API (/data/alumni/photos)."""
    genre, cle = cible.split(":", 1)
    if genre == "evenement":
        return f"evenements/{uuid.uuid5(ESPACE_EVENEMENTS, 'evenement/' + cle)}.jpg"
    if genre == "evenement-etendu":
        return f"evenements/{uuid.uuid5(ESPACE_EVENEMENTS, 'evenement-etendu/' + cle)}.jpg"
    return f"publications/{identifiant_stockage(cible)}.png"
