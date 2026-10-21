# Bonnes pratiques Spring Boot 4 pas encore appliquées au projet

Recommandations issues de la documentation Spring 7 / Boot 4. Chacune touche tout le backend :
les proposer à l'équipe, ne pas les introduire au détour d'une fonctionnalité.

| Pratique | Pourquoi | Effet sur le projet |
|---|---|---|
| `spring.jpa.open-in-view=false` | Évite les requêtes cachées dans la couche web et les connexions tenues trop longtemps. | Vérifier que tous les mappers tournent dans une transaction de service (c'est déjà le cas pour mentorat et événements). |
| `ProblemDetail` (RFC 9457) via `ResponseEntityExceptionHandler` | Format d'erreur standard (`type`, `title`, `status`, `detail`), `application/problem+json`. | Change le contrat `{ "message" }` lu par le frontend : migrer le handler et l'intercepteur Angular ensemble. Garder `message` en propriété supplémentaire (`setProperty`) pour la transition. |
| JSpecify (`@NullMarked` dans `package-info.java`, `@Nullable`) | Null-safety vérifiée par l'IDE, adoptée par Spring 7. | Ajout par paquet, sans risque à l'exécution. |
| `RestTestClient` | API de test unique de Spring 7 (remplace MockMvc / TestRestTemplate). | MockMvc reste supporté : adopter pour les nouveaux tests si l'équipe le souhaite. |
| Outil de migration (Flyway) | Index partiels, renommages, données de référence versionnées. | Refusé pour l'instant par l'équipe ; à rediscuter avant la mise en production. |
| Vrai envoi d'e-mails (`spring-boot-starter-mail`) | `EmailService` écrit seulement dans les logs. | Configurer SMTP par variables d'environnement en production. |

Sources : documentation Spring Framework « Error Responses » (docs.spring.io), notes de version
Spring Boot 4 / Framework 7, guides Hibernate sur le N+1 et l'open-in-view.
