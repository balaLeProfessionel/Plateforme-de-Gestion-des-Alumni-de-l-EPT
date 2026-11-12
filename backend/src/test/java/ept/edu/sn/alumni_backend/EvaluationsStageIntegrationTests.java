package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
import ept.edu.sn.alumni_backend.stage.CritereEvaluation;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.entity.ConventionStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.repository.ConventionStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.EvaluationStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Évaluation du stagiaire (STA-06) : convention complète, soumission, verrou, réouverture, décision et accès. */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
class EvaluationsStageIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private ConventionStageRepository conventionRepository;
    @Autowired private EvaluationStageRepository evaluationRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private ChefDepartementRepository chefRepository;
    @Autowired private ApplicationEvents evenements;

    private Utilisateur adminStages;
    private Utilisateur encadrant;
    private Utilisateur chef;
    private Utilisateur compteOrganisme;
    private Utilisateur autrePersonnel;
    private Organisme organisme;
    private Stage stage;

    @BeforeEach
    void preparer() {
        String lot = UUID.randomUUID().toString().substring(0, 8);
        adminStages = compte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        encadrant = compte(TypeRole.PERSONNEL);
        chef = compte(TypeRole.PERSONNEL);
        autrePersonnel = compte(TypeRole.PERSONNEL);
        Filiere filiere = FilieresDeTest.filiere(filiereRepository, "Évaluation " + lot);
        chefRepository.saveAndFlush(new ChefDepartement(filiere, chef, adminStages));
        organisme = new Organisme();
        organisme.setNom("Évalue " + lot);
        organisme.setStatutValidation(StatutCompte.ACTIF);
        organisme = organismeRepository.saveAndFlush(organisme);
        compteOrganisme = compte(TypeRole.ORGANISME);
        compteOrganisme.setOrganisme(organisme);
        utilisateurRepository.saveAndFlush(compteOrganisme);

        Utilisateur etudiant = compte(TypeRole.ETUDIANT);
        etudiant.setFiliere(filiere);
        utilisateurRepository.saveAndFlush(etudiant);
        Stage s = new Stage();
        s.setEtudiant(etudiant);
        s.setOrganisme(organisme);
        s.setTypeStage(TypeStage.PFE);
        s.setSujet("Sujet évalué");
        s.setDateDebut(LocalDate.of(2026, 2, 1));
        s.setDateFin(LocalDate.of(2026, 6, 30));
        s.setStatut(StatutStage.CONFIRME);
        s.setEncadrantInterne(encadrant);
        s.setCreePar(adminStages);
        stage = stageRepository.saveAndFlush(s);
    }

    @AfterEach
    void nettoyer() {
        evaluationRepository.deleteAll();
        conventionRepository.deleteAll();
        stageRepository.deleteAll();
        chefRepository.deleteAll(chefRepository.findAll().stream().filter(c -> c.getChef().getId().equals(chef.getId())).toList());
        compteOrganisme.setOrganisme(null);
        utilisateurRepository.save(compteOrganisme);
        organismeRepository.delete(organisme);
    }

    @Test
    void e01_lOrganismeEvalueApresLaConventionPuisLaFicheEstVerrouillee() throws Exception {
        envoyer(put(membre()), compteOrganisme, "{}").andExpect(status().isConflict());
        conventionComplete();

        envoyer(put(membre()), compteOrganisme, "{\"criteres\":{\"AUTONOMIE\":\"SATISFAISANT\"},\"pointsForts\":\"Rigueur\"}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.etat").value("BROUILLON")).andExpect(jsonPath("$.modifiable").value(true))
            .andExpect(jsonPath("$.grille.length()").value(14));
        // L'encadrant ne lit pas le brouillon, ne saisit pas ; l'étudiant ne voit rien.
        mockMvc.perform(authentifie(get(membre()), encadrant)).andExpect(status().isOk())
            .andExpect(jsonPath("$.pointsForts").doesNotExist()).andExpect(jsonPath("$.modifiable").value(false));
        envoyer(put(membre()), encadrant, "{}").andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get(membre()), stage.getEtudiant())).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(membre()), autrePersonnel)).andExpect(status().isNotFound());

        envoyer(post(membre() + "/soumettre"), compteOrganisme, "{\"criteres\":{\"AUTONOMIE\":\"SATISFAISANT\"}}").andExpect(status().isBadRequest());
        envoyer(post(membre() + "/soumettre"), compteOrganisme, ficheComplete()).andExpect(status().isOk())
            .andExpect(jsonPath("$.etat").value("SOUMISE")).andExpect(jsonPath("$.modifiable").value(false))
            .andExpect(jsonPath("$.stage.email").doesNotExist());
        assertThat(evenements.stream(NotificationCompte.class)).extracting(NotificationCompte::destinataire).containsExactly(encadrant.getEmail());
        envoyer(put(membre()), compteOrganisme, ficheComplete()).andExpect(status().isConflict());

        mockMvc.perform(authentifie(get(membre()), chef)).andExpect(status().isOk())
            .andExpect(jsonPath("$.criteres.PONCTUALITE").value("TRES_SATISFAISANT")).andExpect(jsonPath("$.avisTuteurValide").value(true));
        mockMvc.perform(authentifie(get("/api/stages/suivi"), encadrant)).andExpect(jsonPath("$.encadres[0].evaluation").value("SOUMISE"));
    }

    @Test
    void e02_lAdministrateurDecideRouvreEtSaisitPourUnOrganismeSansCompte() throws Exception {
        conventionComplete();
        envoyer(patch(admin() + "/decision"), adminStages, "{\"valide\":true}").andExpect(status().isConflict());
        envoyer(post(admin() + "/soumettre"), adminStages, ficheComplete()).andExpect(status().isOk())
            .andExpect(jsonPath("$.saisieParEcole").value(true));
        envoyer(patch(admin() + "/decision"), adminStages, "{\"valide\":false}").andExpect(status().isOk())
            .andExpect(jsonPath("$.stageValide").value(false)).andExpect(jsonPath("$.stage.stageValide").value(false));

        envoyer(post(admin() + "/rouvrir"), adminStages, "").andExpect(status().isOk())
            .andExpect(jsonPath("$.etat").value("BROUILLON")).andExpect(jsonPath("$.stageValide").doesNotExist());
        envoyer(put(membre()), compteOrganisme, ficheComplete()).andExpect(status().isOk());
        envoyer(post(admin() + "/rouvrir"), compteOrganisme, "").andExpect(status().isForbidden());
    }

    private void conventionComplete() {
        ConventionStage c = new ConventionStage(stage);
        LocalDate hier = LocalDate.now().minusDays(1);
        c.setSigneeEtudiantLe(hier);
        c.setSigneeOrganismeLe(hier);
        c.setSigneeEcoleLe(hier);
        c.setScan(UUID.randomUUID() + ".pdf");
        conventionRepository.saveAndFlush(c);
    }

    private static String ficheComplete() {
        String criteres = Arrays.stream(CritereEvaluation.values()).map(c -> "\"" + c.name() + "\":\"TRES_SATISFAISANT\"").collect(Collectors.joining(","));
        return "{\"criteres\":{" + criteres + "},\"dureeEffectiveMois\":4.5,\"appreciationGenerale\":\"SATISFAISANT\",\"avisTuteurValide\":true}";
    }

    private String membre() {
        return "/api/stages/suivi/" + stage.getId() + "/evaluation";
    }

    private String admin() {
        return "/api/admin/stages/suivi/" + stage.getId() + "/evaluation";
    }

    private Utilisateur compte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur u = new Utilisateur();
        u.setEmail("evaluation." + UUID.randomUUID() + "@example.invalid");
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
