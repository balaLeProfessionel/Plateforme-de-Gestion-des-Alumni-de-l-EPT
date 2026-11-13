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
# MSYS_NO_PATHCONV : Git Bash (Windows) convertirait les chemins /data/… du conteneur en chemins Windows.
MSYS_NO_PATHCONV=1 docker exec alumni-api mkdir -p /data/alumni/photos/evenements
tar -C "$temporaire" -cf - . | MSYS_NO_PATHCONV=1 docker exec -i alumni-api tar -C /data/alumni/photos -xf -
docker exec -i alumni-db psql -q -U root -d alumni_db -v compte_modele="$compte_modele" < "$dossier/donnees-demo.sql"
docker exec -i alumni-db psql -q -U root -d alumni_db -v compte_modele="$compte_modele" < "$dossier/donnees-demo-etendues.sql"
docker exec -i alumni-db psql -q -U root -d alumni_db < "$dossier/donnees-demo-temoignages.sql"
# Module stages : PDF de démonstration (CV, conventions signées, rapports) puis données (offres, stages…).
pdfs="$temporaire/pdf"
mkdir -p "$pdfs/documents/cv" "$pdfs/documents/conventions" "$pdfs/documents/rapports"
contenu_pdf() {
  printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'
  printf '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n'
  printf '4 0 obj<</Length 60>>stream\nBT /F1 18 Tf 60 760 Td (%s) Tj ET\nendstream endobj\n' "$1"
  printf '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\ntrailer<</Root 1 0 R>>\n%%%%EOF\n'
}
for n in 101 102 103 104 105 106 107 108 109; do contenu_pdf "CV de demonstration" > "$pdfs/documents/cv/f0000000-0000-4000-8000-000000000$n.pdf"; done
for n in 301 302 303; do contenu_pdf "Convention de stage signee - demonstration" > "$pdfs/documents/conventions/f0000000-0000-4000-8000-000000000$n.pdf"; done
for n in 501 503; do contenu_pdf "Rapport de stage - demonstration" > "$pdfs/documents/rapports/f0000000-0000-4000-8000-000000000$n.pdf"; done
tar -C "$pdfs" -cf - . | MSYS_NO_PATHCONV=1 docker exec -i alumni-api tar -C /data/alumni/photos -xf -
docker exec -i alumni-db psql -q -v ON_ERROR_STOP=1 -U root -d alumni_db < "$dossier/donnees-demo-stages.sql"
echo "Données de démonstration chargées."
