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
# MSYS_NO_PATHCONV : Git Bash (Windows) convertirait les chemins /data/… du conteneur en chemins Windows.
MSYS_NO_PATHCONV=1 docker exec alumni-api mkdir -p /data/alumni/photos/evenements
tar -C "$temporaire/evenements" -cf - . | MSYS_NO_PATHCONV=1 docker exec -i alumni-api tar -C /data/alumni/photos/evenements -xf -
docker exec -i alumni-db psql -q -U root -d alumni_db -v compte_modele="$compte_modele" < "$dossier/donnees-demo.sql"
echo "Données de démonstration chargées."
