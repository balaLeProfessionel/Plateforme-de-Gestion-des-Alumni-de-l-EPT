---
name: ept-spring-boot
description: Conventions du backend Spring Boot 4.1 / Java 25 de la plateforme EPT Alumni (projet-alumni/backend). À utiliser dès qu'on ajoute ou modifie une entité JPA, un repository, un service, un contrôleur REST, un DTO, une exception, une règle métier, une notification ou un test d'intégration sous projet-alumni/backend — y compris pour concevoir les tables d'une nouvelle fonctionnalité (offres d'emploi, notifications, programmes…), corriger une erreur 500 ou une contrainte de base, même si la demande ne cite pas Spring.
---

# Backend EPT Alumni — Spring Boot 4.1

Pile : Spring Boot 4.1 (Spring Framework 7, Spring Data JPA 4, Hibernate 7, Jackson 3), Java 25,
PostgreSQL 16 en Docker (`alumni-db`), H2 en mode PostgreSQL pour les tests, JWT maison,
Lombok, springdoc. Noms de classes, méthodes, messages et commentaires **en français**.

## Organisation : un paquet par domaine

```
ept/edu/sn/alumni_backend/<domaine>/
  <Enum>.java            statuts, rôles du domaine (avec leurs transitions)
  entity/                entités JPA
  repository/            interfaces Spring Data
  service/               règles métier, mapper, initialiseurs
  controller/            REST, aucune logique
  dto/                   records Request / Response
  exception/             exceptions métier
  evenement/             événements applicatifs et écouteurs (si besoin)
```

Modèle de référence : `evenement/` et `mentorat/`. Les erreurs sont toutes traduites dans
`common/exception/GlobalExceptionHandler.java`.

## Règles par couche — détails et exemples dans `references/couches.md`

- **Entité** : `@Getter @Setter` Lombok, id `UUID` (`GenerationType.UUID`), énumérations en
  `EnumType.STRING` avec `length`, dates `Instant` posées par `@PrePersist`/`@PreUpdate`,
  associations `FetchType.LAZY`, contraintes **nommées** (`uk_…`, `ck_…`, `ix_…`) via
  `@UniqueConstraint`, `@Check`, `@Index`. Pas de cascade de suppression : on garde l'historique.
- **DTO** : `record` ; validation Bean Validation sur la requête (`@NotBlank`, `@Size`, `@Min`…) ;
  la réponse ne contient jamais email, téléphone, date de naissance d'un autre membre.
- **Repository** : méthodes dérivées, `@Query` JPQL + projections pour les comptages,
  `@EntityGraph` pour les associations *to-one* d'une liste, `@Lock(PESSIMISTIC_WRITE)` pour
  verrouiller une ligne. `Specification` composées avec `Specification.unrestricted()`
  (jamais `null`, refusé par Spring Data 4).
- **Service** : `@Service @RequiredArgsConstructor`, `@Transactional(readOnly = true)` pour
  les lectures, `@Transactional` pour les écritures. Toute règle métier est ici, pas dans le
  contrôleur ni seulement dans le frontend.
- **Contrôleur** : `@RestController @Validated`, `@AuthenticationPrincipal UtilisateurPrincipal`,
  `@Valid @RequestBody`, pagination bornée (`@Min(0)`, `@Max(48)`), `201 Created` + `Location`
  à la création, une route `PATCH /{id}/<action>` par changement de statut.

## Sécurité et visibilité

- Tout `/api/**` est authentifié (JWT) sauf les exceptions de `SecurityConfig`.
- Rôle insuffisant pour une action : `throw new SecurityException("…")` → **403**.
- Ressource privée (mentorat, brouillon…) consultée par quelqu'un d'autre : **404**, pour ne pas
  révéler son existence. Centraliser le contrôle dans un composant d'accès
  (ex. `AccesMentorat.chargerPourParticipant`).
- Visibilité des membres : réutiliser `MembreVisibilite` (compte vérifié, statut actif/en attente).

## Contrat d'erreur (le frontend en dépend)

Le corps d'erreur est `{"message": "…"}`, et `{ "<champ>": "<message>" }` pour une validation.
Le frontend lit `error.message`. Une nouvelle exception métier = une classe dans `exception/`
+ un `@ExceptionHandler` dans `GlobalExceptionHandler` :

| Situation | Exception | Statut |
|---|---|---|
| introuvable / non autorisé à voir | `<Domaine>IntrouvableException` | 404 |
| état incompatible, capacité atteinte, doublon | `Conflit<Domaine>Exception` | 409 |
| conflit de version optimiste | `ObjectOptimisticLockingFailureException` | 409 |
| donnée invalide | `IllegalArgumentException` | 400 |
| rôle interdit | `SecurityException` | 403 |

Spring 7 propose `ProblemDetail` (RFC 9457) : ne pas l'introduire pour une seule route.
Ce serait une migration de tout le contrat, à décider avec l'équipe (voir `references/ameliorations.md`).

## Schéma de base sans outil de migration

Le projet utilise `spring.jpa.hibernate.ddl-auto=update` (pas de Flyway, décision de l'équipe).
Conséquences à respecter :
- Hibernate crée tables, colonnes, `@Check`, `@UniqueConstraint`, `@Index` à la création d'une
  table, mais **ne sait pas** créer un index unique partiel ni modifier une contrainte existante.
- Une règle d'unicité conditionnelle (« une seule demande en cours ») se vérifie dans le service,
  **sous verrou pessimiste** de la ligne parente, en plus d'un éventuel contrôle en base.
- Données de référence (domaines, établissement EPT…) : un `ApplicationRunner` idempotent
  (`existsByCode` avant d'insérer). Ne jamais écraser une donnée modifiée par un administrateur.
- Renommer une colonne ou durcir un `NOT NULL` sur une table existante demande un script SQL
  manuel : le signaler au lieu de compter sur `ddl-auto`.

## Images envoyées par les membres

`common/image/FormatImage` impose le format quelle que soit l'image reçue : vérifie la taille minimale
(`verifierTailleMinimale`, 400 sinon), recadre au centre au rapport voulu, redimensionne exactement
(`appliquer`) et écrit un JPEG de qualité maîtrisée (`ecrireJpeg`). Formats : `EVENEMENT` 1600×900,
`PHOTO_PROFIL` 600×600. Un nouveau type d'image = une nouvelle constante, aligné sur le frontend
(`shared/images/recadrage.ts`).

## Concurrence

- Capacité limitée (places d'événement, mentorés) : verrouiller la ligne parente
  (`findByIdForUpdate`) puis compter, dans la même transaction.
- Entité modifiée par plusieurs personnes : `@Version long version`.

## Performance

- Liste paginée : `@EntityGraph(attributePaths = "…")` pour les *to-one* ; pour une collection,
  `@BatchSize(size = 50)` sur l'association (un `JOIN FETCH` de collection casse la pagination).
- Comptages pour une page : une requête groupée (`… where id in :ids group by …`) + projection,
  jamais une requête par ligne.
- Filtre sur une collection : sous-requête `exists` plutôt qu'une jointure + `DISTINCT`
  (PostgreSQL refuse `DISTINCT` avec un tri sur une colonne non sélectionnée).

## Notifications

Publier un événement (`ApplicationEventPublisher`) et l'envoyer dans un
`@TransactionalEventListener` (après commit) : aucun message pour une transaction annulée.
`EmailService` écrit pour l'instant dans les logs (`docker compose logs api`).

## Tests — gabarit dans `references/tests-integration.md`

Chaque règle métier a un test d'intégration MockMvc (`@SpringBootTest @AutoConfigureMockMvc`,
H2, JWT généré par `JwtService`). La base H2 est partagée par toutes les classes : un test qui
crée des lignes référençant `utilisateur` les supprime en `@AfterEach`, sinon
`ProfilPublicIntegrationTests` (qui vide les utilisateurs) échoue.

```bash
./mvnw -q -o compile
```

```bash
./mvnw -q -o test
```

Résultat : `target/surefire-reports/*.txt`. Le conteneur `alumni-api` (mode watch) se recompile
seul ; vérifier ensuite `curl http://localhost:8080/api/...` et les logs.
