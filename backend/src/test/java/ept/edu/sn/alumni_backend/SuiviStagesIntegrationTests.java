package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
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

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.ChefDepartement;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.ChefDepartementRepository;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Suivi des stages confirmés (STA-08) : encadrant interne, maître de stage, vues de l'encadrant, du chef et de l'organisme. */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
class SuiviStagesIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private ChefDepartementRepository chefRepository;
    @Autowired private ApplicationEvents evenements;

    private String lot;
    private Utilisateur adminStages;
    private Utilisateur enseignant;
    private Utilisateur chef;
    private Utilisateur compteOrganisme;
    private Organisme organisme;
    private Filiere filiere;
    private Stage stage;
    private Stage autreFiliere;

    @BeforeEach
    void preparer() {
        lot = UUID.randomUUID().toString().substring(0, 8);
        adminStages = compte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        enseignant = compte(TypeRole.PERSONNEL);
        enseignant.setNom("Enseignant" + lot);
        utilisateurRepository.saveAndFlush(enseignant);
        chef = compte(TypeRole.PERSONNEL);
        filiere = FilieresDeTest.filiere(filiereRepository, "Suivi " + lot);
        chefRepository.saveAndFlush(new ChefDepartement(filiere, chef, adminStages));
        organisme = new Organisme();
        organisme.setNom("Accueil " + lot);
        organisme.setStatutValidation(StatutCompte.ACTIF);
        organisme = organismeRepository.saveAndFlush(organisme);
        compteOrganisme = compte(TypeRole.ORGANISME);
        compteOrganisme.setOrganisme(organisme);
        utilisateurRepository.saveAndFlush(compteOrganisme);
        stage = stageConfirme(filiere, organisme);
        autreFiliere = stageConfirme(FilieresDeTest.filiere(filiereRepository, "Autre " + lot), null);
    }

    @AfterEach
    void nettoyer() {
        stageRepository.deleteAll();
        chefRepository.deleteAll(chefRepository.findAll().stream().filter(c -> c.getChef().getId().equals(chef.getId())).toList());
        compteOrganisme.setOrganisme(null);
        utilisateurRepository.save(compteOrganisme);
        organismeRepository.delete(organisme);
    }

    @Test
    void s01_lAdministrateurDesigneUnEncadrantQuiVoitAlorsLeStage() throws Exception {
        mockMvc.perform(authentifie(get("/api/admin/stages/personnel").param("q", "enseignant" + lot), adminStages))
            .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(enseignant.getId().toString()));
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi").param("sansEncadrant", "true").param("q", "accueil " + lot), adminStages))
            .andExpect(jsonPath("$.contenu", hasSize(1)));

        envoyer(patch("/api/admin/stages/suivi/{id}/encadrant", stage.getId()), adminStages, "{\"encadrantId\":\"%s\"}".formatted(enseignant.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.encadrant.id").value(enseignant.getId().toString()))
            .andExpect(jsonPath("$.deroulement").value("A_VENIR"));
        assertThat(evenements.stream(NotificationCompte.class)).extracting(NotificationCompte::destinataire)
            .containsExactlyInAnyOrder(enseignant.getEmail(), stage.getEtudiant().getEmail());
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi").param("sansEncadrant", "true").param("q", "accueil " + lot), adminStages))
            .andExpect(jsonPath("$.contenu", hasSize(0)));

        mockMvc.perform(authentifie(get("/api/stages/suivi"), enseignant))
            .andExpect(jsonPath("$.encadres", hasSize(1)))
            .andExpect(jsonPath("$.encadres[0].email").value(stage.getEtudiant().getEmail()))
            .andExpect(jsonPath("$.departement", hasSize(0)));

        // Un compte qui n'est pas du personnel actif ne peut pas encadrer ; null retire l'encadrant.
        envoyer(patch("/api/admin/stages/suivi/{id}/encadrant", stage.getId()), adminStages, "{\"encadrantId\":\"%s\"}".formatted(chef.getId()))
            .andExpect(status().isOk());
        envoyer(patch("/api/admin/stages/suivi/{id}/encadrant", stage.getId()), adminStages, "{\"encadrantId\":\"%s\"}".formatted(compteOrganisme.getId()))
            .andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/stages/suivi/{id}/encadrant", stage.getId()), adminStages, "{\"encadrantId\":null}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.encadrant").doesNotExist());
    }

    @Test
    void s02_leChefVoitSaFiliereEtLOrganismeSesStagiairesSansEmail() throws Exception {
        mockMvc.perform(authentifie(get("/api/stages/suivi"), chef))
            .andExpect(jsonPath("$.departement", hasSize(1)))
            .andExpect(jsonPath("$.departement[0].id").value(stage.getId().toString()));
        mockMvc.perform(authentifie(get("/api/stages/suivi"), compteOrganisme))
            .andExpect(jsonPath("$.accueillis", hasSize(1)))
            .andExpect(jsonPath("$.accueillis[0].email").doesNotExist())
            .andExpect(jsonPath("$.accueillis[0].tuteurNom").value("Moussa Ndiaye"));
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi").param("filiere", filiere.getId().toString()), adminStages))
            .andExpect(jsonPath("$.contenu", hasSize(1)));
        mockMvc.perform(authentifie(get("/api/stages/suivi"), stage.getEtudiant()))
            .andExpect(jsonPath("$.encadres", hasSize(0))).andExpect(jsonPath("$.accueillis", hasSize(0)));
    }

    @Test
    void s03_leMaitreDeStageSeCorrigeEtLeSuiviResteReserve() throws Exception {
        envoyer(patch("/api/admin/stages/suivi/{id}/tuteur", stage.getId()), adminStages, "{\"nom\":\"\"}").andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/stages/suivi/{id}/tuteur", stage.getId()), adminStages,
                "{\"nom\":\"Fatou Sarr\",\"fonction\":\"Cheffe de projet\",\"email\":\"fatou@example.invalid\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tuteurNom").value("Fatou Sarr"))
            .andExpect(jsonPath("$.tuteurTelephone").doesNotExist());
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi"), enseignant)).andExpect(status().isForbidden());
        Stage declare = stageConfirme(filiere, organisme);
        declare.setStatut(StatutStage.DECLARE);
        stageRepository.saveAndFlush(declare);
        envoyer(patch("/api/admin/stages/suivi/{id}/encadrant", declare.getId()), adminStages, "{\"encadrantId\":\"%s\"}".formatted(enseignant.getId()))
            .andExpect(status().isConflict());
        assertThat(autreFiliere.getId()).isNotNull();
    }

    private Stage stageConfirme(Filiere filiereEtudiant, Organisme accueil) {
        Utilisateur etudiant = compte(TypeRole.ETUDIANT);
        etudiant.setFiliere(filiereEtudiant);
        utilisateurRepository.saveAndFlush(etudiant);
        Stage s = new Stage();
        s.setEtudiant(etudiant);
        s.setOrganisme(accueil);
        if (accueil == null) s.setOrganismePropose("Ailleurs " + lot);
        s.setTypeStage(TypeStage.PFE);
        s.setSujet("Sujet " + lot);
        s.setDateDebut(LocalDate.of(2031, 2, 1));
        s.setDateFin(LocalDate.of(2031, 6, 30));
        s.setTuteurNom("Moussa Ndiaye");
        s.setStatut(StatutStage.CONFIRME);
        s.setCreePar(adminStages);
        return stageRepository.saveAndFlush(s);
    }

    private Utilisateur compte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur u = new Utilisateur();
        u.setEmail("suivi." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Test");
        u.setNom(role.name());
        u.setRole(role);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        u.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(u);
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
