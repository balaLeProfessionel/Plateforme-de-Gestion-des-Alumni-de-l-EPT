#!/usr/bin/env bash
# Restaure une sauvegarde créée par sauvegarder.sh : remplace la base ET les fichiers envoyés.
# Usage : scripts/sauvegarde/restaurer.sh <dossier-de-sauvegarde> [--oui]
# L'API est arrêtée pendant la restauration puis redémarrée.
set -euo pipefail
source_sauvegarde="${1:?Indiquez le dossier de la sauvegarde à restaurer.}"
confirmation="${2:-}"
conteneur_db="${CONTENEUR_DB:-alumni-db}"
conteneur_api="${CONTENEUR_API:-alumni-api}"
repertoire_fichiers="/data/alumni/photos"

source_sauvegarde="$(cd "$source_sauvegarde" && pwd)"
for fichier in base.dump fichiers.tar.gz SHA256SUMS; do
    [ -f "$source_sauvegarde/$fichier" ] || { echo "Fichier manquant : $source_sauvegarde/$fichier" >&2; exit 1; }
done
(cd "$source_sauvegarde" && sha256sum -c --quiet SHA256SUMS) || { echo "Sauvegarde altérée : empreintes différentes." >&2; exit 1; }

if [ "$confirmation" != "--oui" ]; then
    read -r -p "La base et les fichiers actuels seront remplacés par $source_sauvegarde. Continuer ? (oui/non) " reponse
    [ "$reponse" = "oui" ] || { echo "Restauration annulée."; exit 1; }
fi

image_api="$(docker inspect -f '{{.Config.Image}}' "$conteneur_api")"
docker stop "$conteneur_api" > /dev/null
# Quoi qu'il arrive, l'API redémarre à la fin.
trap 'docker start "$conteneur_api" > /dev/null' EXIT

docker exec -i "$conteneur_db" sh -c \
    'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --single-transaction' \
    < "$source_sauvegarde/base.dump"

MSYS_NO_PATHCONV=1 docker run --rm -i --volumes-from "$conteneur_api" --entrypoint sh "$image_api" -c \
    "find '$repertoire_fichiers' -mindepth 1 -delete && tar -xzf - -C '$repertoire_fichiers'" \
    < "$source_sauvegarde/fichiers.tar.gz"

echo "Restauration terminée depuis $source_sauvegarde."
