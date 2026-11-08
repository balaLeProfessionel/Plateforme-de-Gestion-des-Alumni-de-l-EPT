#!/usr/bin/env bash
# Charge les données de démonstration dans la pile Docker de développement (alumni-db, alumni-api).
# Usage : scripts/donnees-demo/charger.sh [email-d-un-compte-modele]
# Les comptes créés reprennent le mot de passe du compte modèle ; sans lui, ils ne permettent pas
# de se connecter. Le script est rejouable : rien n'est dupliqué.
set -euo pipefail
dossier="$(cd "$(dirname "$0")" && pwd)"
compte_modele="${1:-}"
temporaire="$(mktemp -d)"
trap 'rm -rf "$temporaire"' EXIT

python "$dossier/generer-images.py" "$temporaire" > /dev/null
# Données étendues : portraits illustrés, logos d'organismes et visuels d'événements supplémentaires.
python "$dossier/generer-visuels.py" "$temporaire" "$dossier/visuels-etendus.json" > /dev/null
# Photos libres de droits (Wikimedia Commons) : remplacent les visuels dessinés des événements et illustrent
# publications et articles. Écrit aussi photos-libres.sql, qui les rattache en base.
python "$dossier/telecharger-photos.py" "$temporaire" > /dev/null
# MSYS_NO_PATHCONV : Git Bash (Windows) convertirait les chemins /data/… du conteneur en chemins Windows.
MSYS_NO_PATHCONV=1 docker exec alumni-api mkdir -p /data/alumni/photos/evenements /data/alumni/photos/publications
tar -C "$temporaire" --exclude=photos-libres.sql -cf - . | MSYS_NO_PATHCONV=1 docker exec -i alumni-api tar -C /data/alumni/photos -xf -
docker exec -i alumni-db psql -q -U root -d alumni_db -v compte_modele="$compte_modele" < "$dossier/donnees-demo.sql"
docker exec -i alumni-db psql -q -U root -d alumni_db -v compte_modele="$compte_modele" < "$dossier/donnees-demo-etendues.sql"
docker exec -i alumni-db psql -q -U root -d alumni_db < "$dossier/donnees-demo-temoignages.sql"
# Fil d'actualité : publications, annonces, appels à projets, commentaires et « J'aime » des membres ci-dessus.
docker exec -i alumni-db psql -q -U root -d alumni_db < "$dossier/donnees-demo-publications.sql"
# Articles de fond et leur publication porteuse dans le fil.
docker exec -i alumni-db psql -q -U root -d alumni_db < "$dossier/donnees-demo-articles.sql"
# Images des publications et des événements (rejouable : seuls ceux sans image sont complétés).
docker exec -i alumni-db psql -q -U root -d alumni_db < "$temporaire/photos-libres.sql"
echo "Données de démonstration chargées."
