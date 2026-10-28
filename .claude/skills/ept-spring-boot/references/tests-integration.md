# Tests d'intégration backend

Fichier : `src/test/java/ept/edu/sn/alumni_backend/<Domaine>IntegrationTests.java`.
Base : H2 `MODE=PostgreSQL`, `ddl-auto=create-drop`, contexte Spring partagé entre classes.

```java
@SpringBootTest
@AutoConfigureMockMvc   // org.springframework.boot.webmvc.test.autoconfigure (Boot 4)
class MentoratIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;

    /** Les autres classes vident les utilisateurs : supprimer ce qui les référence. */
    @AfterEach
    void nettoyer() {
        evaluationRepository.deleteAll();   // enfants d'abord
        mentoratRepository.deleteAll();
        profilMentorRepository.deleteAll();
    }

    @Test
    void leMentorAccepteDansLaLimiteDeSaCapacite() throws Exception {
        mockMvc.perform(authentifie(patch("/api/mentorat/mentorats/{id}/accepter", seconde), mentor))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez atteint votre nombre maximum de mentorés."));
    }

    private Utilisateur creerUtilisateur(TypeRole role, String nom) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("domaine." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom("Membre");
        utilisateur.setNom(nom + "-" + UUID.randomUUID().toString().substring(0, 6));   // unique : la base est partagée
        utilisateur.setTelephone("+221700000000");
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
```

Lire un identifiant renvoyé : `JsonPath.read(reponse, "$.id")` (`com.jayway.jsonpath.JsonPath`).

## Que couvrir pour chaque fonctionnalité
- Le **rôle** autorisé (et un rôle refusé → 403).
- La **visibilité** : un tiers reçoit 404.
- Chaque **transition** de statut valide, et une transition interdite → 409.
- Les **limites** : capacité, doublon, valeur hors bornes → 400 / 409.
- Le **cycle complet** de bout en bout (création → suivi → clôture).
- Les recherches : filtre appliqué, et un filtre qui exclut.

Comme la base est partagée, ne jamais supposer qu'une table est vide : filtrer par un nom
unique créé dans le test.

Lancer :

```bash
./mvnw -q -o test -Dtest=MentoratIntegrationTests
```

puis toute la suite avant de conclure (`./mvnw -q -o test`), et lire
`target/surefire-reports/*.txt` en cas d'échec.
