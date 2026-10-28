---
name: ept-fonctionnalite
description: Démarche de bout en bout pour livrer une fonctionnalité du backlog de la plateforme EPT Alumni — cadrage, modèle de données, maquettes, backend Spring Boot, frontend Angular, tests, vérification dans le navigateur, mise à jour du backlog et commit. À utiliser dès qu'on entame ou reprend un module ou une histoire du backlog (mentorat, offres d'emploi, notifications, actualités, invitations…), quand l'utilisateur dit « on entame le module X », « implémente l'histoire GAEPT-… », « applique ça », ou demande comment on verrait une fonctionnalité.
---

# Livrer une fonctionnalité EPT Alumni

Ce skill orchestre le travail ; le *comment* technique est dans `ept-spring-boot` (backend)
et `ept-angular` (frontend) : les charger au moment d'écrire le code de chaque côté.

L'utilisateur échange en français : répondre en français, simplement, et le tenir informé
pendant les longues étapes.

## Repères du projet

- Dépôt : `projet-alumni/` (branches `feat/<module>`, base `develop`).
- Backlog : `backlog-github/backlog-github.md` (épics et histoires GAEPT-xx, critères d'acceptation).
- Lancer la pile : dans `projet-alumni/`, `docker compose up --build --watch`
  (frontend :4200, API :8080, base `alumni-db`). Docker Desktop doit être démarré.
- Comptes de test locaux : `alumni-tests-navigateur/.env` (non versionné). Ne jamais recopier
  un mot de passe dans une réponse. Un nouveau compte de test s'y consigne.
- Le bandeau rouge « Invalid PrimeUI License » est attendu (licence absente), ce n'est pas un bug.

## Étapes

### 1. Cadrer avant de coder
1. Lire l'épic et ses histoires dans le backlog ; chercher ce qui existe déjà dans le code
   (entrée de navigation, entités réutilisables, `EmailService`, `MembreVisibilite`…).
2. Proposer une vision courte : données, API, écrans, ordre de livraison en tranches verticales,
   puis **les questions qui restent à trancher** (qui peut faire quoi, limites, référentiels).
3. Si l'utilisateur apporte son propre modèle, partir de **son** modèle : signaler honnêtement
   les trous (relation manquante, table inutile, cardinalité ambiguë) sans le remplacer
   par un modèle plus gros. Distinguer ce qui est exigé par le backlog de ce qui est un ajout.
4. Présenter le modèle de données en diagramme `erDiagram` + un tableau par table
   (colonne, type, contrainte), puis les règles placées en base et celles placées dans le service.
5. Mettre à jour la section du backlog avec les décisions (ajouts marqués « Ajout de conception,
   sans ticket Jira ») quand l'utilisateur le demande.

### 2. Maquettes (si demandées)
Stitch : projet « EPT Alumni – Mentorat » ou un projet dédié, avec le design system EPT
(primaire #014365, ciel #73DBF2, or #A9782F, Space Grotesk / Inter, arrondi 8 px).
Les générations dépassent souvent le délai : lancer **un écran à la fois** avec le modèle
rapide (`GEMINI_3_5_FLASH_LITE`), puis vérifier `updateTime` du projet ; `list_screens`
peut rester vide alors que l'écran existe. Proposer, ne pas implémenter, tant que l'utilisateur
n'a pas validé.

### 3. Backend d'abord (skill `ept-spring-boot`)
Enums et transitions → entités → repositories → services (règles, verrous, notifications)
→ contrôleur → exceptions dans `GlobalExceptionHandler` → test d'intégration de chaque règle.
`./mvnw -q -o compile` puis le test de la classe, puis **toute** la suite.

### 4. Frontend (skill `ept-angular`)
Modèle TypeScript miroir des records → service `@Service` → routes par rôle → composants
(liste, carte, formulaire, détail) → navigation (barre latérale + mobile) → tests Vitest.
`npx ng test --watch=false` puis `npx ng build` (budgets de style).

### 5. Vérifier comme un utilisateur
Dans le navigateur intégré, sur `http://localhost:4200` :
- dérouler chaque parcours (création, action, erreur de validation, état vide) avec les comptes de test ;
- si un parcours exige un compte dont on n'a pas le mot de passe, simuler l'étape en base
  (`docker exec alumni-db psql -U root -d alumni_db -c "…"`) et **le dire** dans le compte rendu ;
- contrôler la console, les requêtes et les logs de l'API (`docker logs alumni-api`) ;
- largeur bureau puis 375 px : `document.documentElement.scrollWidth === innerWidth`.
Corriger ce qui cloche (dates, libellés, débordements) avant de rendre la main.

### 6. Rendre compte, puis commiter seulement sur demande
Compte rendu en français, structuré :
1. ce que l'utilisateur peut faire maintenant (par rôle) ;
2. bonnes pratiques appliquées **et écarts assumés**, avec leur raison ;
3. choix faits par défaut faute de réponse ;
4. ce qui a été corrigé en chemin ;
5. données créées dans la base locale ;
6. résultats des tests (nombres exacts) et ce qui n'a pas pu être vérifié ;
7. une seule question finale (souvent : « je commite ? »).

Ne jamais commiter ni pousser sans demande explicite. Commits : convention
`type(portée): description` en français (`feat(mentorat): …`, `fix(styles): …`), un commit par
lot cohérent, message terminé par la ligne `Co-Authored-By` fournie par l'environnement.
Ne pas mélanger dans un commit des fichiers qu'une autre session est en train de modifier.
