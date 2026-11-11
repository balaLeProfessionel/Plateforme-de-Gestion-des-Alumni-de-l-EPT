package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockPart;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.repository.CandidatureRepository;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Candidatures aux offres de stage (STA-03) et avis de l'organisme (STA-09). */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class CandidaturesIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private OffreStageRepository offreRepository;
    @Autowired private CandidatureRepository candidatureRepository;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private Utilisateur organisme;
    private Utilisateur autreOrganisme;
    private Utilisateur adminStages;
    private Utilisateur etudiant;
    private Utilisateur autreEtudiant;
    private String offre;

    @BeforeEach
    void preparer() throws Exception {
        organisme = creerCompteOrganisme(StatutCompte.ACTIF);
        autreOrganisme = creerCompteOrganisme(StatutCompte.ACTIF);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        etudiant = creerCompte(TypeRole.ETUDIANT);
        autreEtudiant = creerCompte(TypeRole.ETUDIANT);
        offre = publier(organisme);
    }

    @AfterEach
    void nettoyer() {
        candidatureRepository.deleteAll();
        offreRepository.deleteAll();
        utilisateurRepository.findAll().stream()
            .filter(u -> u.getOrganisme() != null && organismesCrees.contains(u.getOrganisme().getId()))
            .forEach(u -> {
                u.setOrganisme(null);
                utilisateurRepository.save(u);
            });
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void c01_unEtudiantPostuleUneSeuleFoisAvecSonCvAvantLaDateLimite() throws Exception {
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/ma-candidature", offre), etudiant)).andExpect(status().isNoContent());
        postuler(offre, etudiant, cv("CV Awa.pdf"), "Motivée par le développement web.")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ENVOYEE"))
            .andExpect(jsonPath("$.nomCv").value("CV Awa.pdf"))
            .andExpect(jsonPath("$.lettreMotivation").value("Motivée par le développement web."))
            .andExpect(jsonPath("$.avisOrganisme").doesNotExist());
        postuler(offre, etudiant, cv("autre.pdf"), null)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez déjà postulé à cette offre."));

        postuler(offre, autreEtudiant, null, "Sans CV").andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Joignez votre CV en PDF."));
        postuler(offre, creerCompte(TypeRole.ALUMNI), cv("cv.pdf"), null).andExpect(status().isForbidden());
        postuler(offre, organisme, cv("cv.pdf"), null).andExpect(status().isForbidden());

        String close = publier(organisme);
        offreRepository.findById(UUID.fromString(close)).ifPresent(o -> {
            o.setDateLimiteCandidature(LocalDate.now(ZoneId.of("Africa/Dakar")).minusDays(1));
            offreRepository.saveAndFlush(o);
        });
        postuler(close, etudiant, cv("cv.pdf"), null).andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("La date limite de candidature est passée."));

        String soumise = publier(creerCompteOrganisme(StatutCompte.EN_ATTENTE));
        postuler(soumise, etudiant, cv("cv.pdf"), null).andExpect(status().isNotFound());
    }

    @Test
    void c02_lEtudiantRetireSaCandidaturePuisLaRenvoieEnGardantSonCv() throws Exception {
        String candidature = id(postuler(offre, etudiant, cv("cv.pdf"), null));
        avis(candidature, organisme, "RETENUE").andExpect(status().isOk());

        mockMvc.perform(authentifie(patch("/api/stages/offres/{id}/candidature/retirer", offre), etudiant))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("RETIREE"));
        mockMvc.perform(authentifie(patch("/api/stages/offres/{id}/candidature/retirer", offre), etudiant))
            .andExpect(status().isConflict());

        postuler(offre, etudiant, null, "Je renvoie ma candidature.")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(candidature))
            .andExpect(jsonPath("$.statut").value("ENVOYEE"))
            .andExpect(jsonPath("$.nomCv").value("cv.pdf"));
        // L'avis portait sur l'envoi précédent : il repart de zéro.
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), organisme))
            .andExpect(jsonPath("$[0].avisOrganisme").value("EN_ATTENTE"));
        mockMvc.perform(authentifie(get("/api/stages/mes-candidatures"), etudiant))
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].titreOffre").value("Offre"));
    }

    @Test
    void c03_lOrganismeVoitLesCandidaturesEnvoyeesSansEmailEtLEcoleVoitTout() throws Exception {
        postuler(offre, etudiant, cv("cv.pdf"), null);
        postuler(offre, autreEtudiant, cv("cv.pdf"), null);
        mockMvc.perform(authentifie(patch("/api/stages/offres/{id}/candidature/retirer", offre), autreEtudiant));

        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), organisme))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].etudiant.id").value(etudiant.getId().toString()))
            .andExpect(jsonPath("$[0].email").doesNotExist());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), adminStages))
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[*].email", hasItem(etudiant.getEmail())));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), autreOrganisme)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), etudiant)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/mes-offres"), organisme))
            .andExpect(jsonPath("$[0].nombreCandidatures").value(1));
    }

    @Test
    void c04_seulLOrganismeDeLOffreDonneUnAvisQueLEtudiantNeVoitPas() throws Exception {
        String candidature = id(postuler(offre, etudiant, cv("cv.pdf"), null));
        avis(candidature, autreOrganisme, "RETENUE").andExpect(status().isNotFound());
        avis(candidature, adminStages, "RETENUE").andExpect(status().isNotFound());
        avis(candidature, organisme, "NON_RETENUE")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.avisOrganisme").value("NON_RETENUE"))
            .andExpect(jsonPath("$.avisDonneLe").isNotEmpty());
        String reponse = mockMvc.perform(authentifie(get("/api/stages/offres/{id}/ma-candidature", offre), etudiant))
            .andReturn().getResponse().getContentAsString();
        org.assertj.core.api.Assertions.assertThat(reponse).doesNotContain("RETENUE");
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), adminStages))
            .andExpect(jsonPath("$[0].avisOrganisme").value("NON_RETENUE"));
    }

    @Test
    void c05_leCvSeTelechargeParLEtudiantLOrganismeEtLEcoleSeulement() throws Exception {
        String candidature = id(postuler(offre, etudiant, cv("Mon CV.pdf"), null));
        mockMvc.perform(authentifie(get("/api/stages/candidatures/{id}/cv", candidature), etudiant))
            .andExpect(status().isOk()).andExpect(content().contentType(MediaType.APPLICATION_PDF));
        mockMvc.perform(authentifie(get("/api/stages/candidatures/{id}/cv", candidature), organisme)).andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/stages/candidatures/{id}/cv", candidature), autreEtudiant)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/candidatures/{id}/cv", candidature), autreOrganisme)).andExpect(status().isNotFound());

        mockMvc.perform(authentifie(patch("/api/stages/offres/{id}/candidature/retirer", offre), etudiant));
        mockMvc.perform(authentifie(get("/api/stages/candidatures/{id}/cv", candidature), organisme)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/candidatures/{id}/cv", candidature), adminStages)).andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/candidatures", offre), organisme))
            .andExpect(jsonPath("$[*].id", not(hasItem(candidature))));
    }

    private ResultActions postuler(String offreId, Utilisateur auteur, MockMultipartFile cv, String lettre) throws Exception {
        MockMultipartHttpServletRequestBuilder requete = multipart("/api/stages/offres/{id}/candidature", offreId);
        if (cv != null) requete.file(cv);
        if (lettre != null) requete.part(new MockPart("lettre", lettre.getBytes(StandardCharsets.UTF_8)));
        return mockMvc.perform(authentifie(requete, auteur));
    }

    private ResultActions avis(String candidature, Utilisateur auteur, String avis) throws Exception {
        return mockMvc.perform(authentifie(patch("/api/stages/candidatures/{id}/avis", candidature)
            .contentType(MediaType.APPLICATION_JSON).content("{\"avis\":\"" + avis + "\"}"), auteur));
    }

    private String publier(Utilisateur auteur) throws Exception {
        String corps = """
            {"titre":"Offre","description":"Missions","competences":"Rigueur","dureeMois":4,"typeStage":"PFE","dateLimiteCandidature":"%s"}
            """.formatted(LocalDate.now(ZoneId.of("Africa/Dakar")).plusDays(20));
        return id(mockMvc.perform(authentifie(post("/api/stages/mes-offres").contentType(MediaType.APPLICATION_JSON).content(corps), auteur))
            .andExpect(status().isCreated()));
    }

    private static String id(ResultActions resultat) throws Exception {
        return JsonPath.read(resultat.andReturn().getResponse().getContentAsString(), "$.id");
    }

    private static MockMultipartFile cv(String nom) {
        return new MockMultipartFile("cv", nom, "application/pdf", "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
    }

    private Utilisateur creerCompteOrganisme(StatutCompte statut) {
        Organisme entite = new Organisme();
        entite.setNom("Organisme " + UUID.randomUUID());
        entite.setStatutValidation(statut);
        entite = organismeRepository.saveAndFlush(entite);
        organismesCrees.add(entite.getId());
        Utilisateur compte = nouveauCompte(TypeRole.ORGANISME);
        compte.setOrganisme(entite);
        return utilisateurRepository.saveAndFlush(compte);
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = nouveauCompte(role);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(compte);
    }

    private static Utilisateur nouveauCompte(TypeRole role) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("candidatures." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom("Test");
        compte.setNom(role.name());
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        return compte;
    }

    private <B extends AbstractMockHttpServletRequestBuilder<B>> B authentifie(B requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
