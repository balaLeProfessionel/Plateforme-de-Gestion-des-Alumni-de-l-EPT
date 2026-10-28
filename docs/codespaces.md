# Développement personnel avec GitHub Codespaces

Chaque Codespace est un environnement personnel. Le dépôt reste commun au binôme ; le développement local et son `docker compose up --build --watch` restent disponibles.

## Accès et création

1. Utiliser son propre compte GitHub, collaborateur avec le droit d'écriture sur le dépôt. Aucun fork ni clone manuel n'est nécessaire : Codespaces clone la branche choisie.
2. Dans ses paramètres GitHub personnels, vérifier le quota Codespaces, fixer un budget et choisir un délai d'inactivité court, par exemple 15 minutes.
3. Facultatif : dans **Settings → Codespaces → Secrets**, définir `ALUMNI_GIT_NAME` et `ALUMNI_GIT_EMAIL`, avec l'accès limité à ce dépôt. Ils configurent l'identité Git locale sans imposer une identité au binôme.
4. Ouvrir le dépôt, sélectionner une branche contenant `.devcontainer/devcontainer.json`, puis **Code → Codespaces → … → New with options**. Sélectionner son compte comme payeur lorsque ce choix est proposé. Commencer avec 2 cœurs et 8 Go de RAM ; 4 cœurs et 16 Go sont plus confortables pour compiler et tester simultanément.
5. Attendre la préparation de Java 25, Maven, Node.js 24, npm et Docker. Les dépendances Angular sont installées avec le fichier de verrouillage existant.

La configuration doit être publiée sur la branche GitHub avant de créer le Codespace. Les modifications non poussées du PC n'y seront pas présentes. Une fois le Codespace créé, le retrouver depuis **github.com/codespaces** sur PC ou tablette, ou l'ouvrir avec VS Code sur PC.

Pour l'identité demandée par sowibrr, les valeurs personnelles sont `sowibrr` et `ibous2005@gmail.com`. Si les variables personnelles n'ont pas été définies avant la création, lancer dans le terminal du Codespace :

```bash
git config --local user.name sowibrr
git config --local user.email ibous2005@gmail.com
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
```

## Lancer et arrêter

Depuis la racine du dépôt, dans le terminal du Codespace :

```bash
node .devcontainer/compose.mjs up --build --watch
```

Ouvrir **Ports → 4200 → Ouvrir dans le navigateur** et conserver sa visibilité **Private**. Cette URL HTTPS permet de tester l'application depuis ses appareils connectés au même compte GitHub. Le serveur n'autorise que le domaine exact de ce Codespace en plus des hôtes locaux. Les appels `/api` passent par le proxy Angular vers le backend ; PostgreSQL et l'API ne publient aucun port hôte dans cette configuration.

Le lanceur transmet ce même domaine à l'API avec `APP_CORS_ALLOWED_ORIGINS`. Le réglage général `app.cors.allowed-origins` conserve `http://localhost:4200` par défaut.

Le lanceur réutilise les services, les images et tout le `develop.watch` du Compose de développement. Une seule commande lance donc le projet avec la synchronisation des sources. Il ne lance aucune commande Git de commit ou de push.

Pour consulter l'état ou arrêter les services depuis un second terminal :

```bash
node .devcontainer/compose.mjs ps
node .devcontainer/compose.mjs logs --tail 100
node .devcontainer/compose.mjs stop
```

Arrêter également le Codespace dans GitHub quand le travail est terminé : arrêter seulement les conteneurs n'arrête pas la facturation du Codespace. Le stockage peut rester facturé après son arrêt, selon le quota disponible.

## Vérifications

```bash
node --test .devcontainer/setup.test.mjs .devcontainer/compose.test.mjs
node .devcontainer/compose.mjs config --quiet
cd backend
mvn --batch-mode --no-transfer-progress verify
cd ../frontend
npm test -- --watch=false
npm run build
```

Le conteneur dispose des outils Java et Node nécessaires aux tests, indépendamment des services applicatifs. Aucun accès aux données du binôme n'est nécessaire.

## Données, clés et reconstruction

PostgreSQL, les photos de profil et les images d'événements sont propres au Codespace. Ils sont conservés dans `.local/codespaces/`, sous le dépôt monté dans `/workspaces`. Le répertoire est ignoré par Git. Les identifiants PostgreSQL et la clé JWT de développement sont générés au premier lancement, puis réutilisés ; le `.env` local du PC est ignoré par le lanceur.

Ces fichiers persistent à l'arrêt, au redémarrage et à la reconstruction du conteneur. **Supprimer le Codespace supprime aussi ses données**. Le délai de suppression automatique se règle dans les paramètres GitHub personnels. Une clé manquante ou abîmée doit être restaurée avec la base correspondante, pas régénérée pour une base existante.

Un nouveau Codespace démarre avec une base vide. Git ne synchronise ni la base, ni les images, ni les secrets. Pour conserver les données du PC actuel, exporter PostgreSQL et les photos, puis les importer dans le Codespace. Pour des tests reproductibles entre binômes, utiliser un jeu de données fictives commun.

## Sauvegarde avant suppression ou restauration

Arrêter le serveur `watch` avec `Ctrl+C` dans son terminal, puis effectuer cette sauvegarde dans le terminal Bash du Codespace. Le backend est arrêté pendant l'export pour conserver une base cohérente avec les photos :

```bash
node .devcontainer/compose.mjs stop web api
backup=".local/codespaces/backups/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
node .devcontainer/compose.mjs exec -T db pg_dump -U alumni_dev -d alumni_db -Fc > "$backup/database.dump"
tar -czf "$backup/photos.tar.gz" -C .local/codespaces/photos .
cp .local/codespaces/.env "$backup/environment.env"
```

Vérifier que les commandes ont réussi, puis télécharger les trois fichiers et les conserver ensemble, dans un emplacement privé hors du Codespace. `environment.env` contient les clés de cet environnement. Les sauvegardes restées uniquement dans le Codespace disparaissent avec lui. Pour reprendre, relancer la commande `up --build --watch`.

## Travail en binôme

Une fois cette configuration fusionnée dans `develop`, créer une branche par tâche depuis `develop`, pousser son travail et ouvrir une PR vers `develop`. En attendant cette fusion, partir de `chore/codespaces-personnel` pour conserver les fichiers de configuration. Avant de changer d'appareil ou d'environnement, pousser les commits à retrouver ailleurs. Le binôme continue à utiliser son clone et son propre `.env` ; il n'a pas à ouvrir de Codespace. Les quotas personnels et les clés restent indépendants.
