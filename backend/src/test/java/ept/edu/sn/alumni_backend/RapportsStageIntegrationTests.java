package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.repository.RapportStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Rapport de stage (STA-07) : date limite en lot, dépôt PDF, remplacement, fermeture et accès. */
@SpringBootTest
@AutoConfigureMockMvc
@RecordApplicationEvents
class RapportsStageIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private RapportStageRepository rapportRepository;
    @Autowired private ApplicationEvents evenements;

    private Utilisateur adminStages;
    private Utilisateur encadrant;
    private Utilisateur compteOrganisme;
    private Organisme organisme;
    private Stage stage;
    private Stage autre;

    @BeforeEach
    void preparer() {
        adminStages = compte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        encadrant = compte(TypeRole.PERSONNEL);
        organisme = new Organisme();
        organisme.setNom("Rapport " + UUID.randomUUID().toString().substring(0, 8));
        organisme.setStatutValidation(StatutCompte.ACTIF);
        organisme = organismeRepository.saveAndFlush(organisme);
        compteOrganisme = compte(TypeRole.ORGANISME);
        compteOrganisme.setOrganisme(organisme);
        utilisateurRepository.saveAndFlush(compteOrganisme);
        stage = stage(StatutStage.CONFIRME);
        autre = stage(StatutStage.CONFIRME);
    }

    @AfterEach
    void nettoyer() {
        rapportRepository.deleteAll();
        stageRepository.deleteAll();
        compteOrganisme.setOrganisme(null);
        utilisateurRepository.save(compteOrganisme);
        organismeRepository.delete(organisme);
    }

    @Test
    void r01_lEtudiantDeposeEtRemplaceSonRapportAvantLaDateLimite() throws Exception {
        deposer(stage.getEtudiant(), "rapport.pdf").andExpect(status().isConflict());

        dateLimite(LocalDate.now().plusDays(10), stage.getId(), autre.getId()).andExpect(status().isOk()).andExpect(jsonPath("$.misAJour").value(2));
        assertThat(evenements.stream(NotificationCompte.class)).extracting(NotificationCompte::destinataire)
            .containsExactlyInAnyOrder(stage.getEtudiant().getEmail(), autre.getEtudiant().getEmail());
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), stage.getEtudiant()))
            .andExpect(jsonPath("$[0].rapport.etat").value("ATTENDU")).andExpect(jsonPath("$[0].rapport.depotOuvert").value(true));

        deposer(stage.getEtudiant(), "premier.pdf").andExpect(status().isOk()).andExpect(jsonPath("$.etat").value("DEPOSE"));
        deposer(stage.getEtudiant(), "second.pdf").andExpect(status().isOk()).andExpect(jsonPath("$.nomFichier").value("second.pdf"));
        assertThat(evenements.stream(NotificationCompte.class).filter(n -> n.destinataire().equals(encadrant.getEmail()))).hasSize(1);

        // Lecteurs : étudiant, encadrant, organisme (maître de stage), école ; pas un autre étudiant.
        for (Utilisateur lecteur : new Utilisateur[] {stage.getEtudiant(), encadrant, compteOrganisme}) {
            mockMvc.perform(authentifie(get(url() + "/fichier"), lecteur)).andExpect(status().isOk()).andExpect(content().bytes(pdf("second.pdf")));
        }
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi/{id}/rapport/fichier", stage.getId()), adminStages)).andExpect(status().isOk());
        mockMvc.perform(authentifie(get(url() + "/fichier"), autre.getEtudiant())).andExpect(status().isNotFound());
        deposer(autre.getEtudiant(), "pas-le-sien.pdf").andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi"), adminStages))
            .andExpect(jsonPath("$.contenu[?(@.id == '%s')].rapport.etat".formatted(stage.getId())).value("DEPOSE"));
    }

    @Test
    void r02_leDepotFermeApresLaDateLimiteEtLesFichiersInvalidesSontRefuses() throws Exception {
        dateLimite(LocalDate.now(), stage.getId()).andExpect(status().isOk());
        mockMvc.perform(authentifie(multipart(url()).file(new MockMultipartFile("fichier", "rapport.pdf", "application/pdf",
            "pas un pdf".getBytes(StandardCharsets.UTF_8))), stage.getEtudiant())).andExpect(status().isBadRequest());

        dateLimite(LocalDate.now().minusDays(1), stage.getId()).andExpect(status().isOk());
        deposer(stage.getEtudiant(), "rapport.pdf").andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), stage.getEtudiant())).andExpect(jsonPath("$[0].rapport.etat").value("EN_RETARD"));

        Stage declare = stage(StatutStage.DECLARE);
        dateLimite(LocalDate.now(), declare.getId()).andExpect(status().isConflict());
        dateLimite(LocalDate.now(), stage.getId()).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/stages/rapports/date-limite").contentType(MediaType.APPLICATION_JSON)
            .content("{\"stageIds\":[\"%s\"],\"dateLimite\":\"2030-01-01\"}".formatted(stage.getId())), encadrant)).andExpect(status().isForbidden());
    }

    private ResultActions deposer(Utilisateur auteur, String nom) throws Exception {
        return mockMvc.perform(authentifie(multipart(url()).file(new MockMultipartFile("fichier", nom, "application/pdf", pdf(nom))), auteur));
    }

    private ResultActions dateLimite(LocalDate date, UUID... ids) throws Exception {
        String liste = String.join(",", java.util.Arrays.stream(ids).map(id -> "\"" + id + "\"").toList());
        return mockMvc.perform(authentifie(patch("/api/admin/stages/rapports/date-limite").contentType(MediaType.APPLICATION_JSON)
            .content("{\"stageIds\":[%s],\"dateLimite\":\"%s\"}".formatted(liste, date)), adminStages));
    }

    private static byte[] pdf(String nom) {
        return ("%PDF-1.4 " + nom).getBytes(StandardCharsets.UTF_8);
    }

    private String url() {
        return "/api/stages/suivi/" + stage.getId() + "/rapport";
    }

    private Stage stage(StatutStage statut) {
        Stage s = new Stage();
        s.setEtudiant(compte(TypeRole.ETUDIANT));
        s.setOrganisme(organisme);
        s.setTypeStage(TypeStage.PFE);
        s.setSujet("Sujet rapport");
        s.setDateDebut(LocalDate.of(2026, 2, 1));
        s.setDateFin(LocalDate.of(2026, 6, 30));
        s.setStatut(statut);
        s.setEncadrantInterne(encadrant);
        s.setCreePar(adminStages);
        return stageRepository.saveAndFlush(s);
    }

    private Utilisateur compte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur u = new Utilisateur();
        u.setEmail("rapport." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Test");
        u.setNom(role.name());
        u.setRole(role);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        u.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(u);
    }

    private <B extends AbstractMockHttpServletRequestBuilder<B>> B authentifie(B requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
