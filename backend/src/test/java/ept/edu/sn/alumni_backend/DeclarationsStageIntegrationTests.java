package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.ArrayList;
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
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Stages trouvés hors offre (STA-10) : déclaration, retrait, validation, refus, chevauchements, droits. */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
class DeclarationsStageIntegrationTests {
    private static final LocalDate DEBUT = LocalDate.of(2030, 2, 1);

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private ApplicationEvents evenements;

    private final List<String> nomsOrganismes = new ArrayList<>();
    private Utilisateur etudiant;
    private Utilisateur adminStages;
    private String lot;

    @BeforeEach
    void preparer() {
        lot = UUID.randomUUID().toString().substring(0, 8);
        etudiant = creerCompte(TypeRole.ETUDIANT);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
    }

    @AfterEach
    void nettoyer() {
        stageRepository.deleteAll();
        nomsOrganismes.forEach(nom -> organismeRepository.findByNomIgnoreCase(nom).ifPresent(organismeRepository::delete));
    }

    @Test
    void d01_lEtudiantDeclareUnStageChezUnOrganismeInconnuEtLEcoleEstPrevenue() throws Exception {
        String nom = organisme("Startup " + lot);
        declarer(etudiant, null, nom, DEBUT, DEBUT.plusMonths(3))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("DECLARE"))
            .andExpect(jsonPath("$.organisme").value(nom))
            .andExpect(jsonPath("$.organismeId").doesNotExist())
            .andExpect(jsonPath("$.tuteurNom").value("Moussa Ndiaye"))
            .andExpect(jsonPath("$.email").doesNotExist());
        assertThat(evenements.stream(NotificationCompte.class)).extracting(NotificationCompte::destinataire).contains(adminStages.getEmail());
        assertThat(organismeRepository.findByNomIgnoreCase(nom)).as("l'organisme n'est créé qu'à la validation").isEmpty();

        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), etudiant))
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].statut").value("DECLARE"))
            .andExpect(jsonPath("$[0].organisme").value(nom))
            .andExpect(jsonPath("$[0].declare").value(true));

        declarer(etudiant, null, nom, DEBUT, DEBUT.minusDays(1)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La fin du stage ne peut pas précéder son début."));
        declarer(etudiant, null, null, DEBUT, DEBUT.plusMonths(1)).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Indiquez l'organisme qui vous accueille."));
        declarer(creerCompte(TypeRole.ALUMNI), null, nom, DEBUT, DEBUT.plusMonths(1)).andExpect(status().isForbidden());
    }

    @Test
    void d02_lAdministrateurValideEnEnregistrantLOrganismeProposePuisLEtudiantEstPrevenu() throws Exception {
        String nom = organisme("Atelier " + lot);
        String id = id(declarer(etudiant, null, nom, DEBUT, DEBUT.plusMonths(3)));
        mockMvc.perform(authentifie(get("/api/admin/stages/declarations/a-traiter"), adminStages))
            .andExpect(jsonPath("$.nombre").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
        mockMvc.perform(authentifie(get("/api/admin/stages/declarations"), adminStages))
            .andExpect(jsonPath("$.contenu[?(@.id == '%s')].email".formatted(id)).value(org.hamcrest.Matchers.contains(etudiant.getEmail())));
        evenements.clear();

        envoyer(patch("/api/admin/stages/declarations/{id}/valider", id), adminStages, "{}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("CONFIRME"))
            .andExpect(jsonPath("$.organismeId").isNotEmpty())
            .andExpect(jsonPath("$.decideLe").isNotEmpty());
        assertThat(organismeRepository.findByNomIgnoreCase(nom)).get().extracting(Organisme::getStatutValidation).isEqualTo(StatutCompte.EN_ATTENTE);
        assertThat(evenements.stream(NotificationCompte.class)).singleElement()
            .satisfies(n -> assertThat(n.destinataire()).isEqualTo(etudiant.getEmail()))
            .satisfies(n -> assertThat(n.message()).contains(nom));
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), etudiant)).andExpect(jsonPath("$[0].statut").value("CONFIRME"));
        envoyer(patch("/api/admin/stages/declarations/{id}/valider", id), adminStages, "{}").andExpect(status().isConflict());
        envoyer(patch("/api/stages/declarations/{id}/retirer", id), etudiant, "").andExpect(status().isConflict());
    }

    @Test
    void d03_unRefusExigeUnMotifEtUneDeclarationEnAttenteSeRetire() throws Exception {
        Organisme connu = new Organisme();
        connu.setNom(organisme("Connu " + lot));
        connu.setStatutValidation(StatutCompte.ACTIF);
        connu = organismeRepository.saveAndFlush(connu);
        String refusee = id(declarer(etudiant, connu.getId(), null, DEBUT, DEBUT.plusMonths(2)));
        envoyer(patch("/api/admin/stages/declarations/{id}/refuser", refusee), adminStages, "{}").andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/stages/declarations/{id}/refuser", refusee), adminStages, "{\"motif\":\"Convention impossible\"}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("REFUSE"));
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), etudiant))
            .andExpect(jsonPath("$[0].statut").value("REFUSE"))
            .andExpect(jsonPath("$[0].motif").value("Convention impossible"))
            .andExpect(jsonPath("$[0].organisme").value(connu.getNom()));

        String enAttente = id(declarer(etudiant, connu.getId(), null, DEBUT.plusMonths(6), DEBUT.plusMonths(8)));
        envoyer(patch("/api/stages/declarations/{id}/retirer", enAttente), creerCompte(TypeRole.ETUDIANT), "").andExpect(status().isNotFound());
        envoyer(patch("/api/stages/declarations/{id}/retirer", enAttente), etudiant, "").andExpect(status().isNoContent());
        assertThat(stageRepository.findById(UUID.fromString(enAttente))).isEmpty();
    }

    @Test
    void d04_deuxStagesConfirmesNeSeChevauchentJamais() throws Exception {
        String nom = organisme("Chevauchement " + lot);
        String premier = id(declarer(etudiant, null, nom, DEBUT, DEBUT.plusMonths(3)));
        String second = id(declarer(etudiant, null, nom, DEBUT.plusMonths(2), DEBUT.plusMonths(5)));
        envoyer(patch("/api/admin/stages/declarations/{id}/valider", premier), adminStages, "{}").andExpect(status().isOk());
        envoyer(patch("/api/admin/stages/declarations/{id}/valider", second), adminStages, "{}")
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(containsString("les dates se chevauchent")));
        // Une fois le premier confirmé, une nouvelle déclaration qui le chevauche est refusée tout de suite.
        declarer(etudiant, null, nom, DEBUT.plusMonths(1), DEBUT.plusMonths(2)).andExpect(status().isConflict());
        declarer(etudiant, null, nom, DEBUT.plusMonths(4), DEBUT.plusMonths(6)).andExpect(status().isCreated());
    }

    @Test
    void d05_laFileEstReserveeALAdministrateurStages() throws Exception {
        mockMvc.perform(authentifie(get("/api/admin/stages/declarations"), etudiant)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/stages/declarations"), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_COMPTES)))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/stages/declarations").param("statut", "EN_PREPARATION"), adminStages))
            .andExpect(status().isBadRequest());
    }

    private String organisme(String nom) {
        nomsOrganismes.add(nom);
        return nom;
    }

    private ResultActions declarer(Utilisateur auteur, UUID organismeId, String nomOrganisme, LocalDate debut, LocalDate fin) throws Exception {
        String corps = """
            {%s"typeStage":"MAITRISE","sujet":"Application mobile","lieu":"Thiès","dateDebut":"%s","dateFin":"%s",
             "tuteurNom":"Moussa Ndiaye","tuteurFonction":"CTO","tuteurEmail":"moussa@example.invalid"}
            """.formatted(organismeId != null ? "\"organismeId\":\"" + organismeId + "\","
                : nomOrganisme != null ? "\"nomOrganisme\":\"" + nomOrganisme + "\"," : "", debut, fin);
        return envoyer(post("/api/stages/declarations"), auteur, corps);
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private static String id(ResultActions resultat) throws Exception {
        return JsonPath.read(resultat.andReturn().getResponse().getContentAsString(), "$.id");
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("declaration." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom("Test");
        compte.setNom(role.name());
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(compte);
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
