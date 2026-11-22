package ept.edu.sn.alumni_backend;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.StatutStage;
import ept.edu.sn.alumni_backend.stage.TypeStage;
import ept.edu.sn.alumni_backend.stage.entity.Stage;
import ept.edu.sn.alumni_backend.stage.repository.ConventionStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Convention de stage (STA-05) : clauses, trois signatures, scan signé, complétude. */
@SpringBootTest
@AutoConfigureMockMvc
class ConventionsStageIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private ConventionStageRepository conventionRepository;

    private Utilisateur adminStages;
    private Stage stage;

    @BeforeEach
    void preparer() {
        adminStages = compte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        stage = stage(StatutStage.CONFIRME);
    }

    @AfterEach
    void nettoyer() {
        conventionRepository.deleteAll();
        stageRepository.deleteAll();
    }

    @Test
    void c01_laConventionDevientCompleteAvecTroisSignaturesEtLeScan() throws Exception {
        mockMvc.perform(authentifie(get(url()), adminStages))
            .andExpect(status().isOk()).andExpect(jsonPath("$.existe").value(false)).andExpect(jsonPath("$.etat").value("AUCUNE"));

        envoyer(put(url()), "{\"assurance\":\"AXA 123\",\"indemnite\":\" 100 000 FCFA par mois \",\"logement\":\"\",\"clauseConfidentialite\":true}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.indemnite").value("100 000 FCFA par mois"))
            .andExpect(jsonPath("$.logement").doesNotExist())
            .andExpect(jsonPath("$.etat").value("EN_COURS"))
            .andExpect(jsonPath("$.stage.convention").value("EN_COURS"));

        for (String partie : new String[] {"ETUDIANT", "ORGANISME", "ECOLE"}) {
            envoyer(patch(url() + "/signature"), "{\"partie\":\"%s\",\"date\":\"%s\"}".formatted(partie, LocalDate.now().minusDays(1)))
                .andExpect(status().isOk());
        }
        mockMvc.perform(authentifie(get(url()), adminStages)).andExpect(jsonPath("$.etat").value("EN_COURS"));

        byte[] pdf = "%PDF-1.4 convention".getBytes(StandardCharsets.UTF_8);
        mockMvc.perform(authentifie(multipart(url() + "/scan").file(new MockMultipartFile("fichier", "convention signée.pdf", "application/pdf", pdf)), adminStages))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.scanNom").value("convention signée.pdf"))
            .andExpect(jsonPath("$.etat").value("COMPLETE"));
        mockMvc.perform(authentifie(get(url() + "/scan"), adminStages)).andExpect(status().isOk()).andExpect(content().bytes(pdf));
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi"), adminStages))
            .andExpect(jsonPath("$.contenu[?(@.id == '%s')].convention".formatted(stage.getId())).value("COMPLETE"));

        // Les membres qui suivent le stage lisent la convention complète ; l'étudiant la voit dans Mes stages.
        mockMvc.perform(authentifie(get("/api/stages/suivi/{id}/convention/scan", stage.getId()), stage.getEtudiant()))
            .andExpect(status().isOk()).andExpect(content().bytes(pdf));
        mockMvc.perform(authentifie(get("/api/stages/suivi/{id}/convention/scan", stage.getId()), compte(TypeRole.ETUDIANT)))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), stage.getEtudiant()))
            .andExpect(jsonPath("$[0].convention").value("COMPLETE")).andExpect(jsonPath("$[0].encadrant").doesNotExist());

        // Retirer une signature fait repasser la convention en cours.
        envoyer(patch(url() + "/signature"), "{\"partie\":\"ECOLE\",\"date\":null}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.etat").value("EN_COURS"));
    }

    @Test
    void c02_lesSaisiesInvalidesSontRefusees() throws Exception {
        envoyer(patch(url() + "/signature"), "{\"partie\":\"ECOLE\",\"date\":\"%s\"}".formatted(LocalDate.now().plusDays(3)))
            .andExpect(status().isBadRequest());
        envoyer(patch(url() + "/signature"), "{\"date\":\"2030-01-01\"}").andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(multipart(url() + "/scan")
                .file(new MockMultipartFile("fichier", "scan.pdf", "application/pdf", "pas un pdf".getBytes(StandardCharsets.UTF_8))), adminStages))
            .andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get(url() + "/scan"), adminStages)).andExpect(status().isNotFound());

        Stage declare = stage(StatutStage.DECLARE);
        envoyer(put("/api/admin/stages/suivi/{id}/convention", declare.getId()), "{\"clauseConfidentialite\":false}")
            .andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi/{id}/convention", declare.getId()), adminStages))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(url()), stage.getEtudiant())).andExpect(status().isForbidden());
    }

    @Test
    void c03_laConventionGenereeReprendLeStageSansBaliseRestante() throws Exception {
        for (TypeStage type : TypeStage.values()) {
            stage.setTypeStage(type);
            stage = stageRepository.saveAndFlush(stage);
            String texte = texteDocument(mockMvc.perform(authentifie(get(url() + "/document"), adminStages))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, org.hamcrest.Matchers.containsString("Convention")))
                .andReturn().getResponse().getContentAsByteArray());
            assertFalse(texte.contains("{{"), type + " : balise restante");
            assertTrue(texte.contains("«\u00a0Sujet convention\u00a0»"), type + " : sujet");
            assertTrue(texte.contains("au sein de Organisme convention"), type + " : organisme");
            assertTrue(texte.contains("Pr. Mamadou WADE"), type + " : directeur");
            assertTrue(texte.contains("du 1 février 2031 au 30 juin 2031"), type + " : dates");
            assertEquals(type == TypeStage.PFE || type == TypeStage.RECHERCHE, texte.contains("devant un jury"), type + " : article 9");
            // Sans clauses saisies : allocation en pointillés, ni NB de confidentialité ni conditions particulières.
            assertTrue(texte.contains("allocation mensuelle de …………………… FCFA"), type + " : allocation");
            assertFalse(texte.contains("NB\u00a0:"), type + " : confidentialité");
            assertFalse(texte.contains("Conditions particulières"), type + " : conditions");
        }
    }

    @Test
    void c04_lesClausesSaisiesApparaissentDansLaConventionGeneree() throws Exception {
        envoyer(put(url()), "{\"assurance\":\"AXA <police> & co\",\"indemnite\":\"100 000 FCFA\",\"logement\":\"\",\"clauseConfidentialite\":true}")
            .andExpect(status().isOk());
        String texte = texteDocument(mockMvc.perform(authentifie(get(url() + "/document"), adminStages))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsByteArray());
        assertTrue(texte.contains("allocation mensuelle de 100 000 FCFA."));
        assertTrue(texte.contains("NB\u00a0:"));
        assertTrue(texte.contains("Article 12 – Conditions particulières"));
        assertTrue(texte.contains("Assurance\u00a0: AXA <police> & co."), "la saisie est échappée, pas interprétée");
        assertFalse(texte.contains("Logement\u00a0:"));

        Stage declare = stage(StatutStage.DECLARE);
        mockMvc.perform(authentifie(get("/api/admin/stages/suivi/{id}/convention/document", declare.getId()), adminStages))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(url() + "/document"), stage.getEtudiant())).andExpect(status().isForbidden());
    }

    /** Texte du corps de la convention (word/document.xml sans balises XML, entités décodées). */
    private static String texteDocument(byte[] docx) throws IOException {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(docx))) {
            for (ZipEntry partie; (partie = zip.getNextEntry()) != null; ) {
                if (partie.getName().equals("word/document.xml")) {
                    String xml = new String(zip.readAllBytes(), StandardCharsets.UTF_8);
                    return xml.replaceAll("</w:p>", "\n").replaceAll("<[^>]+>", "")
                        .replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&amp;", "&");
                }
            }
        }
        throw new AssertionError("word/document.xml absent");
    }

    private String url() {
        return "/api/admin/stages/suivi/" + stage.getId() + "/convention";
    }

    private Stage stage(StatutStage statut) {
        Stage s = new Stage();
        s.setEtudiant(compte(TypeRole.ETUDIANT));
        s.setOrganismePropose("Organisme convention");
        s.setTypeStage(TypeStage.PFE);
        s.setSujet("Sujet convention");
        s.setDateDebut(LocalDate.of(2031, 2, 1));
        s.setDateFin(LocalDate.of(2031, 6, 30));
        s.setStatut(statut);
        s.setCreePar(adminStages);
        return stageRepository.saveAndFlush(s);
    }

    private Utilisateur compte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur u = new Utilisateur();
        u.setEmail("convention." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Test");
        u.setNom(role.name());
        u.setRole(role);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        u.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(u);
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), adminStages));
    }

    private <B extends AbstractMockHttpServletRequestBuilder<B>> B authentifie(B requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
