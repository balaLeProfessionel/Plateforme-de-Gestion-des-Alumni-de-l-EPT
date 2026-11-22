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

## Developpement avec GitHub Codespaces

Un environnement personnel est disponible dans `.devcontainer`, avec Java 25, Node.js 24 et Docker. Il réutilise le Compose de développement et son `watch`, sans changer le fonctionnement local du binôme. Consulter le [guide Codespaces](docs/codespaces.md) pour créer l'environnement, lancer l'application et sauvegarder ses données.

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
| `PRIMENG_LICENSE` | Licence PrimeNG, injectée dans le frontend à la compilation. Sans elle, PrimeNG affiche une bannière |
| `GOOGLE_CLIENT_ID` | Identifiant client OAuth Google du bouton « Continuer avec Google ». Vide : le bouton n'apparaît pas |
| `APP_PREMIER_ADMIN_EMAIL` | Adresse du premier compte d'administration |
| `APP_PREMIER_ADMIN_PASSWORD` | Mot de passe provisoire de ce compte, 8 caractères au moins |

### Connexion avec Google

Le bouton « Continuer avec Google » (pages de connexion et de création de compte) :

- **adresse connue** : ouvre la session du compte ; un compte suspendu reste refusé. Un compte dont l'adresse n'avait jamais été vérifiée l'est alors, et son mot de passe est remplacé (il a pu être créé par quelqu'un d'autre avec cette adresse) ;
- **adresse inconnue** : mène à l'inscription, pré-remplie avec le prénom, le nom et l'adresse donnés par Google. La personne choisit son profil (pas « étudiant », ces comptes sont créés par l'administration) ; l'adresse est vérifiée par Google, donc pas de code par e-mail ni de mot de passe (il pourra être choisi plus tard par « Mot de passe oublié »). La validation par l'administration est inchangée : seuls les alumni et le personnel à l'adresse EPT sont actifs tout de suite.

1. Dans la console Google Cloud, créer un identifiant OAuth de type « Application Web ».
2. Ajouter dans « Origines JavaScript autorisées » chaque adresse du frontend, par exemple `http://localhost:4200` en développement et l'adresse publique en production. Aucune URI de redirection n'est nécessaire.
3. Renseigner `GOOGLE_CLIENT_ID` dans `.env` puis relancer la pile. Aucun secret client n'est utilisé : le serveur vérifie la signature du jeton avec les clés publiques de Google, l'émetteur, l'audience (cet identifiant) et l'expiration.

Le fichier `.env` reste local et ne doit pas être ajouté au dépôt. `.env.example` contient uniquement une configuration de développement.

## Premier compte d'administration

Au démarrage, si la base n'a aucun administrateur, le backend crée ce compte à partir des deux variables `APP_PREMIER_ADMIN_*`. Son titulaire doit changer le mot de passe à la première connexion. Une fois le compte créé, retirez les deux variables de l'environnement : elles ne servent plus, et les comptes suivants se créent depuis l'administration.

- Si les variables sont vides, le backend démarre sans administrateur et l'indique dans ses logs.
- Si l'adresse ou le mot de passe est invalide, ou si l'adresse appartient déjà à un compte, le backend refuse de démarrer et en donne la raison dans ses logs. Un compte existant n'est jamais promu.

## Fichiers envoyés et sauvegardes

Les fichiers envoyés par les membres sont rangés dans le volume Docker `profile_photos`, monté sur `/data/alumni/photos` (`APP_STORAGE_PHOTOS_DIR`). La base ne garde que leur nom.

| Contenu | Sous-dossier |
|---|---|
| Photos de profil | racine |
| Images d'événements | `evenements/` |
| Images d'offres de stage | `offres/` |
| Pièces jointes PDF des offres | `documents/offres/` |
| CV des candidatures | `documents/cv/` |

Le backend accède à ces fichiers par l'interface `DepotFichiers` (`common/stockage`). L'implémentation actuelle, `DepotFichiersDisque`, suppose une seule instance de l'API. Pour un stockage objet compatible S3 (MinIO, S3…), il suffit d'ajouter une implémentation de cette interface : les services métier ne changent pas.

La base et les fichiers se sauvegardent ensemble :

```bash
scripts/sauvegarde/sauvegarder.sh
```

Le script crée `sauvegardes/<date>/` avec `base.dump`, `fichiers.tar.gz` et leurs empreintes (`SHA256SUMS`). Il garde 14 jours de sauvegardes en local (`CONSERVATION_JOURS`). Avec `COPIE_DISTANTE=utilisateur@serveur:/chemin`, il copie aussi chaque sauvegarde hors du serveur par `rsync`. Une sauvegarde qui reste sur le même disque que les données ne protège pas contre la perte du serveur.

Exemple de planification chaque nuit à 2 h (`crontab -e` sur le serveur) :

```
0 2 * * * cd /chemin/du/projet && COPIE_DISTANTE=sauvegarde@serveur:/srv/alumni scripts/sauvegarde/sauvegarder.sh >> /var/log/alumni-sauvegarde.log 2>&1
```

Pour restaurer, le script vérifie les empreintes, arrête l'API, remplace la base et les fichiers, puis redémarre l'API :

```bash
scripts/sauvegarde/restaurer.sh sauvegardes/<date>
```

## CI/CD

Les pull requests et les push vers `develop` et `main` déclenchent :

1. les tests et la compilation du backend ;
2. les tests et la compilation du frontend ;
3. la validation des fichiers Docker Compose ;
4. la construction des images Docker.

Après un push sur `develop` ou `main`, les images backend et frontend sont publiées dans GitHub Container Registry avec un tag de branche et un tag lié au SHA du commit. Les pull requests construisent les images sans les publier.

Le cycle recommandé est : branche fonctionnelle vers `develop`, puis pull request de `develop` vers `main` après validation.
