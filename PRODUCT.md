# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Public prioritaire quand les besoins entrent en conflit : **les diplômés de l'EPT**. Ils retrouvent un autre diplômé par filière ou par promotion, tiennent leur parcours à jour, proposent du mentorat et suivent les événements de l'école.

Autres publics, définis par les rôles du code (`TypeRole`) :

- **Étudiants** : trouvent un diplômé, demandent un mentorat, puis font leurs demandes de stage et de mobilité. Leurs comptes sont créés par l'administration, pas par l'inscription publique.
- **Personnel de l'EPT** : profil proposé à l'inscription.
- **Organismes partenaires** : complètent et gèrent la fiche de leur organisme.
- **Administrateurs** : valident ou refusent les inscriptions, suspendent les comptes, changent les rôles, enregistrent les diplomations. Ces actions sont journalisées.
- **Visiteurs** : profil proposé à l'inscription.

Le compte rendu de la rencontre avec le service des relations extérieures (09/06/2026) prévoit aussi le chef des relations extérieures, le directeur de l'école et les enseignants-chercheurs pour le module conventions, stages et mobilités.

## Product Purpose

Outil officiel de l'École Polytechnique de Thiès, commandé par le CRI, pour gérer et suivre ses alumni, ainsi que ses stages, ses mobilités et ses partenariats, sur une seule plateforme. Sujet de référence : `docs/sujet-du-projet.md`.

Il remplace une situation documentée dans le compte rendu du 09/06/2026 : aucun système structuré pour les alumni, stages suivis dans des fichiers Excel non centralisés, conventions rédigées à la main sous Word, mobilités sur papier, notifications envoyées à la main.

## Positioning

Un réseau vérifié par l'école. Le compte d'un diplômé ou d'un membre du personnel qui utilise une adresse officielle de l'EPT est actif dès la vérification de son e-mail. Les autres comptes restent en attente de vérification par l'administration, qui peut valider ou refuser ; d'après le code (`AuthService`), ils gardent un accès complet avec un badge en attente. L'annuaire est structuré par filière et par promotion : on sait à qui on parle, ce qu'un groupe LinkedIn ou WhatsApp de diplômés ne garantit pas.

La vérification porte donc sur le badge, pas sur l'accès : ne pas écrire que toutes les inscriptions sont validées avant d'entrer sur la plateforme.

## Operating Context

Inscription : choix du profil, code de vérification reçu par e-mail, complétion du profil. Le statut du compte suit la règle décrite dans Positioning. L'application est en français.

Calendrier annuel des partenariats, à automatiser : en octobre, message aux entreprises pour recueillir des sujets de PFE ; en mars, demandes d'offres de stage.

## Capabilities and Constraints

**Périmètre : plateforme complète.** Alumni, stages, mobilités et partenariats sont conçus à égalité, y compris dans la navigation.

**Écrans présents dans `frontend/src/app/features`** : page publique, authentification et inscription, accueil, annuaire, profil et parcours, mentorat, événements, fiche d'organisme, administration.

**Recherche sur le site** (`/recherche`, champ de l'en-tête) : pages et rubriques publiques, plus les diplômés selon les règles ci-dessous. Le contenu de l'espace membre n'y figure pas.

**Recherche publique des diplômés** (`/annuaire-diplomes`, `GET /api/public/annuaire`) : sans compte, on ne voit que le nom, la promotion et la filière des diplômés au compte vérifié. Il faut au moins 3 lettres, et 10 résultats au plus sont renvoyés. Chaque diplômé y figure par défaut et peut s'en retirer dans les paramètres de son profil. À faire valider par l'école et à annoncer aux membres avant la mise en ligne.

**Actualités** : pour l'instant, ce sont les événements. La page d'accueil montre les 3 prochains événements officiels ouverts à tous (titre, date, lieu, image), sans compte.

**Prévu au backlog, sans écran dédié à ce jour** : stages, mobilités, partenariats et conventions, offres d'emploi, messagerie (ces modules et les trois premiers sont annoncés dans l'en-tête public par des pages « pas encore disponible »), notifications, enquête d'insertion, statistiques, synchronisation LinkedIn, exports.

**Pile existante** : Angular 22, PrimeNG 22, Spring Boot, PostgreSQL. Conventions dans `.claude/skills/ept-angular` et `.claude/skills/ept-spring-boot`.

**Terminologie** : diplômé ou alumni, filière, promotion, parcours (formations et expériences), organisme partenaire, convention (cadre, stage, mobilité), mobilité (stage, crédit, recherche, enseignant-chercheur), PFE.

**Non décidé** : date de mise en ligne.

## Brand Commitments

- Nom : École Polytechnique de Thiès (EPT). La plateforme est présentée comme un outil de l'école et peut parler en son nom.
- Logo : `frontend/public/images/logo-ept.png`.
- Liens officiels relevés sur ept.edu.sn : voir `LIENS_ECOLE` dans `frontend/src/app/features/vitrine/contenu-vitrine.ts`.
- Ton : factuel, précis, lié à ce que la plateforme fait vraiment. Pas de slogans ni de formules creuses du type « faites grandir la communauté » ou « Prêt à… ? ».
- Aucune charte graphique officielle de l'EPT n'a été signalée.

## Evidence on Hand

**Disponible** : logo de l'EPT ; photo du campus `frontend/public/images/connexion-campus.jpg` ; compte rendu de la rencontre et backlog produit, hors du dépôt, dans le dossier parent.

**À obtenir** : d'autres photos réelles du campus et des promotions, à demander quand un écran en a besoin. Ne pas les remplacer par des images de banque ou générées présentées comme réelles.

**Provisoire** : « 43 nationalités », « 3 727 alumni » et « 200 fans » (`CHIFFRES_CLES`, partagés par l'accueil et la connexion ; source de « fans » à préciser). Les offres d'emploi s'affichent « À venir ». Affichage toléré pour la démo. À retirer ou à confirmer par l'école avec une source avant toute mise en ligne.

**Démonstration uniquement** : les témoignages de `scripts/donnees-demo` sont fictifs et ne vont jamais en production. Sans témoignage en base, la section reste absente de la page.

**Absent, à ne pas inventer** : vrais témoignages (texte, nom, promotion, fonction, organisation, pays, photo et accord écrit de la personne), noms d'entreprises partenaires, autres statistiques.

## Product Principles

1. **Le diplômé d'abord.** En cas de conflit entre publics, le parcours du diplômé l'emporte, sans bloquer le travail des autres rôles.
2. **La vérification se voit.** Rôle, filière, promotion et statut du compte fondent la confiance : ils restent lisibles là où une personne est présentée.
3. **Rien sans source.** Chiffre, partenaire ou promesse : ce que l'école n'a pas confirmé ne part pas en production.
4. **Une seule plateforme.** Stages, mobilités et partenariats appartiennent au même produit que le réseau alumni, sans présenter comme disponible ce qui ne fonctionne pas encore.
5. **Remplacer le papier pour de bon.** Une démarche de l'école doit être plus simple et mieux tracée ici que dans Word, Excel ou par e-mail.

## Accessibility & Inclusion

WCAG 2.2 AA, contrôlé avec AXE. Liste de contrôle : `.claude/skills/ept-angular/references/accessibilite.md`.
