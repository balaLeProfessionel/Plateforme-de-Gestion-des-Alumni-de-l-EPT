#!/usr/bin/env bash
# Sauvegarde la base PostgreSQL et les fichiers envoyés (photos, images, PDF) de la pile Docker.
# Usage : scripts/sauvegarde/sauvegarder.sh
# Variables facultatives :
#   DOSSIER_SAUVEGARDES   dossier de destination (défaut : ./sauvegardes à la racine du projet)
#   CONSERVATION_JOURS    durée de conservation locale, en jours (défaut : 14)
#   COPIE_DISTANTE        destination rsync hors du serveur, ex. sauvegarde@serveur:/srv/alumni (défaut : aucune)
# Crée un dossier horodaté contenant base.dump (pg_dump, format custom), fichiers.tar.gz et SHA256SUMS.
set -euo pipefail
racine="$(cd "$(dirname "$0")/../.." && pwd)"
destination_racine="${DOSSIER_SAUVEGARDES:-$racine/sauvegardes}"
conservation="${CONSERVATION_JOURS:-14}"
conteneur_db="${CONTENEUR_DB:-alumni-db}"
conteneur_api="${CONTENEUR_API:-alumni-api}"
repertoire_fichiers="/data/alumni/photos"

horodatage="$(date +%Y-%m-%d_%H%M%S)"
destination="$destination_racine/$horodatage"
mkdir -p "$destination"
# En cas d'échec, pas de sauvegarde incomplète qui passerait pour valide.
trap 'echo "Échec : sauvegarde incomplète supprimée." >&2; rm -rf "$destination"' ERR

# 1. La base d'abord, puis les fichiers : un fichier envoyé entre les deux étapes est en trop dans l'archive
#    (sans effet), alors que l'ordre inverse pourrait laisser la base pointer vers un fichier absent.
docker exec "$conteneur_db" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$destination/base.dump"

# 2. Le volume des fichiers, lu depuis un conteneur jetable de l'image de l'API (fonctionne même API arrêtée).
image_api="$(docker inspect -f '{{.Config.Image}}' "$conteneur_api")"
MSYS_NO_PATHCONV=1 docker run --rm --volumes-from "$conteneur_api" --entrypoint tar "$image_api" \
    -czf - -C "$repertoire_fichiers" . > "$destination/fichiers.tar.gz"

(cd "$destination" && sha256sum base.dump fichiers.tar.gz > SHA256SUMS)
trap - ERR

if [ -n "${COPIE_DISTANTE:-}" ]; then
    rsync -a "$destination" "$COPIE_DISTANTE/"
fi

# Rotation locale : seuls les dossiers horodatés créés par ce script sont concernés.
find "$destination_racine" -mindepth 1 -maxdepth 1 -type d -name '20[0-9][0-9]-*' -mtime +"$conservation" -exec rm -rf {} +

echo "Sauvegarde créée : $destination ($(du -sh "$destination" | cut -f1))"
