package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.support.TransactionTemplate;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.admin.service.MigrationPermissionsAdmin;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.evenement.repository.EvenementRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Super administrateur et responsabilités des administrateurs (TRA-13). */
@SpringBootTest
@AutoConfigureMockMvc
class AdministrateursIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private ActionAdminRepository actionAdminRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private EvenementRepository evenementRepository;
    @Autowired private MigrationPermissionsAdmin migration;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private TransactionTemplate transaction;

    private Utilisateur superAdmin;
    private final List<UUID> evenementsCrees = new ArrayList<>();

    @BeforeEach
    void preparer() {
        superAdmin = creerAdmin("Super", PermissionAdmin.GERER_ADMINISTRATEURS);
    }

    @AfterEach
    void nettoyer() {
        evenementRepository.deleteAllById(evenementsCrees);
        actionAdminRepository.deleteAll();
        refreshTokenRepository.deleteAll();
    }

    @Test
    void t01_unAdministrateurOrdinaireNeDecideRienSurUnCompteDAdministration() throws Exception {
        Utilisateur gestionnaire = creerAdmin("Comptes", PermissionAdmin.GERER_COMPTES);
        Utilisateur autreAdmin = creerAdmin("Autre", PermissionAdmin.GERER_STAGES);
        Utilisateur alumni = creerMembre(TypeRole.ALUMNI);

        envoyer(post("/api/admin/comptes"), gestionnaire, """
            {"prenom":"Nouvel","nom":"Admin","email":"nouvel.%s@example.invalid","role":"ADMIN"}
            """.formatted(UUID.randomUUID()))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.message").value("Seul un super administrateur peut gérer les comptes d'administration."));
        envoyer(patch("/api/admin/comptes/{id}/role", alumni.getId()), gestionnaire, "{\"role\":\"ADMIN\",\"motif\":\"Renfort\"}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/admin/comptes/{id}/role", autreAdmin.getId()), gestionnaire, "{\"role\":\"ALUMNI\",\"motif\":\"Départ\"}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/admin/comptes/{id}/suspendre", autreAdmin.getId()), gestionnaire, "{\"motif\":\"Abus\"}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", autreAdmin.getId()), gestionnaire,
            "{\"responsabilites\":[\"GERER_COMPTES\"]}")
            .andExpect(status().isForbidden());

        assertThat(roleDe(alumni)).isEqualTo(TypeRole.ALUMNI);
        assertThat(statutDe(autreAdmin)).isEqualTo(StatutCompte.ACTIF);
        assertThat(permissionsDe(autreAdmin)).containsExactly(PermissionAdmin.GERER_STAGES);
        // Les comptes des membres restent de son ressort.
        envoyer(patch("/api/admin/comptes/{id}/suspendre", alumni.getId()), gestionnaire, "{\"motif\":\"Abus\"}")
            .andExpect(status().isOk());
    }

    @Test
    void t02_uneResponsabiliteCocheeSAppliqueDesLaRequeteSuivanteEtEstJournalisee() throws Exception {
        Utilisateur admin = creerAdmin("Stages", PermissionAdmin.GERER_STAGES);
        mockMvc.perform(authentifie(get("/api/admin/comptes"), admin)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/auth/me"), admin))
            .andExpect(jsonPath("$.permissions", containsInAnyOrder("CONSULTER_TABLEAU_DE_BORD", "GERER_STAGES")));

        envoyer(patch("/api/admin/comptes/{id}/responsabilites", admin.getId()), superAdmin,
            "{\"responsabilites\":[\"GERER_STAGES\",\"GERER_COMPTES\"]}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responsabilites", containsInAnyOrder("GERER_COMPTES", "GERER_STAGES")));

        mockMvc.perform(authentifie(get("/api/admin/comptes"), admin)).andExpect(status().isOk());
        assertThat(actionAdminRepository.findByCible_IdOrderByDateActionDesc(admin.getId())).singleElement().satisfies(action -> {
            assertThat(action.getType()).isEqualTo(TypeActionAdmin.MODIFICATION_RESPONSABILITES);
            assertThat(action.getDetails()).isEqualTo("GERER_STAGES → GERER_COMPTES, GERER_STAGES");
            assertThat(action.getAdmin().getId()).isEqualTo(superAdmin.getId());
        });
    }

    @Test
    void t03_unSuperAdministrateurATouteLAdministrationEtNeGardeQueCeStatut() throws Exception {
        Utilisateur admin = creerAdmin("Promu", PermissionAdmin.GERER_COMPTES);
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", admin.getId()), superAdmin,
            "{\"responsabilites\":[\"GERER_ADMINISTRATEURS\",\"GERER_COMPTES\"]}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.responsabilites", containsInAnyOrder("GERER_ADMINISTRATEURS")));

        String[] toutes = Arrays.stream(PermissionAdmin.values()).map(Enum::name).toArray(String[]::new);
        mockMvc.perform(authentifie(get("/api/auth/me"), admin))
            .andExpect(jsonPath("$.permissions", containsInAnyOrder(toutes)));
        mockMvc.perform(authentifie(get("/api/admin/tableau-de-bord"), admin))
            .andExpect(status().isOk());
    }

    @Test
    void t04_refuseLesModificationsSansObjet() throws Exception {
        Utilisateur admin = creerAdmin("Cible", PermissionAdmin.GERER_STAGES);
        Utilisateur alumni = creerMembre(TypeRole.ALUMNI);

        envoyer(patch("/api/admin/comptes/{id}/responsabilites", superAdmin.getId()), superAdmin, "{\"responsabilites\":[]}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(
                "Vous ne pouvez pas modifier vos propres responsabilités : un autre super administrateur doit le faire."));
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", alumni.getId()), superAdmin, "{\"responsabilites\":[\"GERER_STAGES\"]}")
            .andExpect(status().isConflict());
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", admin.getId()), superAdmin, "{\"responsabilites\":[\"GERER_STAGES\"]}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce compte a déjà ces responsabilités."));
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", admin.getId()), superAdmin,
            "{\"responsabilites\":[\"CONSULTER_TABLEAU_DE_BORD\"]}")
            .andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", admin.getId()), superAdmin, "{}")
            .andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/comptes/{id}/responsabilites", UUID.randomUUID()), superAdmin, "{\"responsabilites\":[]}")
            .andExpect(status().isNotFound());
        assertThat(permissionsDe(admin)).containsExactly(PermissionAdmin.GERER_STAGES);
    }

    @Test
    void t05_quitterLAdministrationRetireLesResponsabilitesEtYRevenirNEnRendAucune() throws Exception {
        Utilisateur admin = creerAdmin("Sortant", PermissionAdmin.GERER_STAGES, PermissionAdmin.GERER_MOBILITES);

        envoyer(patch("/api/admin/comptes/{id}/role", admin.getId()), superAdmin, "{\"role\":\"PERSONNEL\",\"motif\":\"Changement de poste\"}")
            .andExpect(status().isOk());
        assertThat(permissionsDe(admin)).isEmpty();

        envoyer(patch("/api/admin/comptes/{id}/role", admin.getId()), superAdmin, "{\"role\":\"ADMIN\",\"motif\":\"Retour\"}")
            .andExpect(status().isOk());
        assertThat(permissionsDe(admin)).isEmpty();
        mockMvc.perform(authentifie(get("/api/auth/me"), admin))
            .andExpect(jsonPath("$.permissions", containsInAnyOrder("CONSULTER_TABLEAU_DE_BORD")));
    }

    @Test
    void t06_unSuperAdministrateurCreeUnAdministrateurSansResponsabiliteEtSuspendUnAutreSuper() throws Exception {
        String reponse = envoyer(post("/api/admin/comptes"), superAdmin, """
            {"prenom":"Awa","nom":"Ndiaye","email":"awa.%s@example.invalid","role":"ADMIN"}
            """.formatted(UUID.randomUUID()))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        UUID cree = UUID.fromString(JsonPath.read(reponse, "$.id"));
        assertThat(permissionsDe(utilisateurRepository.findById(cree).orElseThrow())).isEmpty();

        Utilisateur autreSuper = creerAdmin("AutreSuper", PermissionAdmin.GERER_ADMINISTRATEURS);
        envoyer(patch("/api/admin/comptes/{id}/suspendre", autreSuper.getId()), superAdmin, "{\"motif\":\"Départ de l'école\"}")
            .andExpect(status().isOk());
        assertThat(statutDe(autreSuper)).isEqualTo(StatutCompte.SUSPENDU);
    }

    @Test
    void t07_laMigrationPromeutLesAdministrateursExistantsUneSeuleFois() throws Exception {
        jdbcTemplate.update("delete from utilisateur_permission_admin");
        Utilisateur ancien = creerAdmin("Ancien");
        migration.run(null);
        assertThat(permissionsDe(ancien)).containsExactly(PermissionAdmin.GERER_ADMINISTRATEURS);

        // Ensuite, un administrateur sans responsabilité est un choix : il n'est pas promu au redémarrage.
        Utilisateur nouveau = creerAdmin("Nouveau");
        migration.run(null);
        assertThat(permissionsDe(nouveau)).isEmpty();
    }

    @Test
    void t08_evenementsOfficielsEtProgrammesDemandentLeurResponsabilite() throws Exception {
        Utilisateur sansEvenements = creerAdmin("SansEvenements", PermissionAdmin.GERER_COMPTES);
        Utilisateur chargeEvenements = creerAdmin("Evenements", PermissionAdmin.GERER_EVENEMENTS);

        creerEvenement(sansEvenements).andExpect(jsonPath("$.officielEpt").value(false));
        creerEvenement(chargeEvenements).andExpect(jsonPath("$.officielEpt").value(true));

        envoyer(post("/api/mentorat/programmes"), sansEvenements, """
            {"titre":"Programme","description":"Accompagner les lycéens dans leur orientation.",
             "dateDebut":"2026-11-01","dateFin":"2027-03-31","etapes":[{"titre":"Étape"}]}
            """)
            .andExpect(status().isForbidden());
    }

    private ResultActions creerEvenement(Utilisateur auteur) throws Exception {
        String debut = Instant.now().plus(10, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS).toString();
        ResultActions resultat = envoyer(post("/api/evenements"), auteur, """
            {"titre":"Rencontre","description":"Rencontre des diplômés.","lieu":"Thiès","dateDebut":"%s",
             "dateFin":null,"audience":"TOUS","nombrePlaces":null}
            """.formatted(debut))
            .andExpect(status().isCreated());
        evenementsCrees.add(UUID.fromString(JsonPath.read(resultat.andReturn().getResponse().getContentAsString(), "$.id")));
        return resultat;
    }

    private Utilisateur creerAdmin(String prenom, PermissionAdmin... permissions) {
        Utilisateur admin = nouveauCompte(TypeRole.ADMIN, prenom);
        admin.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(admin);
    }

    private Utilisateur creerMembre(TypeRole role) {
        return utilisateurRepository.saveAndFlush(nouveauCompte(role, "Membre"));
    }

    private static Utilisateur nouveauCompte(TypeRole role, String prenom) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("administrateurs." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom(prenom);
        compte.setNom("Test");
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        return compte;
    }

    private Set<PermissionAdmin> permissionsDe(Utilisateur compte) {
        return transaction.execute(statut -> Set.copyOf(
            utilisateurRepository.findById(compte.getId()).orElseThrow().getPermissionsAdmin()));
    }

    private TypeRole roleDe(Utilisateur compte) {
        return utilisateurRepository.findById(compte.getId()).orElseThrow().getRole();
    }

    private StatutCompte statutDe(Utilisateur compte) {
        return utilisateurRepository.findById(compte.getId()).orElseThrow().getStatutCompte();
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
