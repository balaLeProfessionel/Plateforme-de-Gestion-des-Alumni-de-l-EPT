# Plateforme de gestion des Alumni de l'EPT

Le projet contient une API Spring Boot, une application Angular et une base PostgreSQL.

## Demarrage en developpement

Prérequis : Docker Desktop avec Docker Compose.

```powershell
Copy-Item .env.example .env
docker compose up --build --watch
```

L'application est ensuite accessible sur `http://localhost:4200`. L'API est exposée sur `http://localhost:8080` et PostgreSQL sur le port `5432`. Ces ports peuvent être adaptés dans `.env`.

Le mode `watch` synchronise les sources frontend et redémarre le backend lorsque ses sources changent. Une modification de `pom.xml` ou de `package.json` reconstruit le conteneur concerné.

## Execution proche de la production

Créer un fichier `.env` à partir de `.env.example`, puis remplacer au minimum `POSTGRES_PASSWORD` et `JWT_SECRET` par des valeurs propres à l'environnement.

```powershell
docker compose -f docker-compose.prod.yml up --build -d
```

Seul le frontend est exposé sur la machine hôte. Il transmet les appels `/api` au backend sur le réseau Docker interne.

## Variables d'environnement

| Variable | Utilisation |
| --- | --- |
| `POSTGRES_DB` | Nom de la base PostgreSQL |
| `POSTGRES_USER` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL |
| `DEV_DB_PORT` | Port PostgreSQL local en développement |
| `DEV_API_PORT` | Port local de l'API en développement |
| `DEV_WEB_PORT` | Port local du frontend en développement |
| `PROD_WEB_PORT` | Port local du frontend avec le Compose de production |
| `JWT_SECRET` | Clé Base64 utilisée pour signer les jetons |
| `JWT_EXPIRATION_MS` | Durée de validité d'un jeton d'accès en millisecondes |
| `JWT_REFRESH_EXPIRATION_MS` | Durée de validité d'un jeton de renouvellement en millisecondes |
| `APP_STORAGE_PHOTOS_DIR` | Répertoire persistant des photos de profil dans le conteneur backend |
| `APP_MAX_PHOTO_SIZE` | Taille maximale acceptée pour une photo de profil |

Le fichier `.env` reste local et ne doit pas être ajouté au dépôt. `.env.example` contient uniquement une configuration de développement.

Les photos de profil sont conservées dans le volume Docker `profile_photos`. En production, sauvegarder ce volume avec `postgres_data` avant une mise à jour ou une restauration. Ne placez pas les photos uniquement dans le système de fichiers interne du conteneur : elles seraient perdues lors de sa reconstruction.

## CI/CD

Les pull requests et les push vers `develop` et `main` déclenchent :

1. les tests et la compilation du backend ;
2. les tests et la compilation du frontend ;
3. la validation des fichiers Docker Compose ;
4. la construction des images Docker.

Après un push sur `develop` ou `main`, les images backend et frontend sont publiées dans GitHub Container Registry avec un tag de branche et un tag lié au SHA du commit. Les pull requests construisent les images sans les publier.

Le cycle recommandé est : branche fonctionnelle vers `develop`, puis pull request de `develop` vers `main` après validation.
