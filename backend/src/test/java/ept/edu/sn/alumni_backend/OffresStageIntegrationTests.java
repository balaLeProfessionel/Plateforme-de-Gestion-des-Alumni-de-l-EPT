package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Offres de stage : publication, vérification, retrait et consultation (STA-01, STA-02). */
@SpringBootTest
@AutoConfigureMockMvc
class OffresStageIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private OffreStageRepository offreRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @MockitoSpyBean private EmailService emailService;

    private final String lot = UUID.randomUUID().toString().substring(0, 8);
    private final List<UUID> organismesCrees = new ArrayList<>();
    private Utilisateur organismeValide;
    private Utilisateur organismeEnAttente;
    private Utilisateur adminStages;
    private Utilisateur adminComptes;
    private Utilisateur etudiant;

    @BeforeEach
    void preparer() {
        organismeValide = creerCompteOrganisme("Valide " + lot, StatutCompte.ACTIF);
        organismeEnAttente = creerCompteOrganisme("En attente " + lot, StatutCompte.EN_ATTENTE);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        adminComptes = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_COMPTES);
        etudiant = creerCompte(TypeRole.ETUDIANT);
    }

    @AfterEach
    void nettoyer() {
        offreRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        // Les comptes d'organisme restent (comme les autres comptes de test), détachés de leur organisme.
        utilisateurRepository.findAll().stream().filter(u -> u.getOrganisme() != null && organismesCrees.contains(u.getOrganisme().getId()))
            .forEach(u -> {
                u.setOrganisme(null);
                utilisateurRepository.save(u);
            });
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void o01_unOrganismeValidePublieDirectementUnOrganismeEnAttenteSoumetALaVerification() throws Exception {
        String publiee = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Développeur web", "PFE", "Dakar", 30))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"))
            .andExpect(jsonPath("$.candidaturesOuvertes").value(true)));
        String soumise = id(envoyer(post("/api/stages/mes-offres"), organismeEnAttente, offre("Technicien", "INCLUSION", "Thiès", 30))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("SOUMISE")));
        // L'administrateur Stages est prévenu de l'offre à vérifier ; pas un administrateur sans cette responsabilité.
        verify(emailService).envoyerNotification(eq(adminStages.getEmail()), eq("Une offre de stage attend votre vérification"),
            contains("Technicien"));
        verify(emailService, never()).envoyerNotification(eq(adminComptes.getEmail()), anyString(), anyString());
        verify(emailService, never()).envoyerNotification(eq(adminStages.getEmail()), anyString(), contains("Développeur web"));

        mockMvc.perform(authentifie(get("/api/stages/offres").param("taille", "48"), etudiant))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(publiee)))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(soumise))));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", soumise), etudiant)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", soumise), organismeEnAttente))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("SOUMISE"));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", soumise), organismeValide)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/mes-offres"), organismeEnAttente))
            .andExpect(jsonPath("$[*].id", hasItem(soumise)))
            .andExpect(jsonPath("$[*].id", not(hasItem(publiee))));
    }

    @Test
    void o02_lesChampsObligatoiresEtLaDateLimiteSontVerifies() throws Exception {
        envoyer(post("/api/stages/mes-offres"), organismeValide, """
            {"titre":"","description":"Missions","competences":"Java","dureeMois":3,"typeStage":"PFE","dateLimiteCandidature":"%s"}
            """.formatted(dans(10)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.titre").value("Le titre est obligatoire."));
        envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Hier", "PFE", null, -1))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La date limite de candidature ne peut pas être passée."));
        envoyer(post("/api/stages/mes-offres"), etudiant, offre("Étudiant", "PFE", null, 10)).andExpect(status().isForbidden());
    }

    @Test
    void o03_lAdministrateurStagesPublieOuRefuseUneOffreSoumiseAvecUnMotif() throws Exception {
        String premiere = id(envoyer(post("/api/stages/mes-offres"), organismeEnAttente, offre("Première", "MAITRISE", null, 20)));
        String seconde = id(envoyer(post("/api/stages/mes-offres"), organismeEnAttente, offre("Seconde", "MAITRISE", null, 20)));

        mockMvc.perform(authentifie(get("/api/admin/stages/offres").param("statut", "SOUMISE"), adminStages))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(premiere)));
        envoyer(patch("/api/admin/stages/offres/{id}/publier", premiere), adminStages, "")
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("PUBLIEE"));
        envoyer(patch("/api/admin/stages/offres/{id}/publier", premiere), adminStages, "").andExpect(status().isConflict());
        verify(emailService).envoyerNotification(eq(organismeEnAttente.getEmail()), eq("Votre offre de stage est publiée"), anyString());

        envoyer(patch("/api/admin/stages/offres/{id}/refuser", seconde), adminStages, "{\"motif\":\"\"}").andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/stages/offres/{id}/refuser", seconde), adminStages, "{\"motif\":\"Offre d'emploi, pas de stage\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("REFUSEE"))
            .andExpect(jsonPath("$.motifDecision").value("Offre d'emploi, pas de stage"));
        verify(emailService).envoyerNotification(eq(organismeEnAttente.getEmail()), eq("Votre offre de stage n'a pas été publiée"),
            contains("Offre d'emploi, pas de stage"));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", seconde), organismeEnAttente))
            .andExpect(jsonPath("$.motifDecision").value("Offre d'emploi, pas de stage"));
    }

    @Test
    void o04_lAdministrateurStagesSaisitUneOffrePourUnOrganismeSansCompte() throws Exception {
        String corps = """
            {"nomNouvelOrganisme":"Atelier %s","offre":%s}
            """.formatted(lot, offre("Saisie par l'école", "ALTERNANCE", "Saint-Louis", 15));
        String reponse = envoyer(post("/api/admin/stages/offres"), adminStages, corps)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"))
            .andExpect(jsonPath("$.organisme.nom").value("Atelier " + lot))
            .andReturn().getResponse().getContentAsString();
        organismesCrees.add(UUID.fromString(JsonPath.read(reponse, "$.organisme.id")));

        envoyer(post("/api/admin/stages/offres"), adminComptes, corps).andExpect(status().isForbidden());
        envoyer(post("/api/admin/stages/offres"), adminStages, "{\"offre\":" + offre("Sans organisme", "PFE", null, 15) + "}")
            .andExpect(status().isBadRequest());
    }

    @Test
    void o05_uneOffreRetireeDisparaitEtSeulSonOrganismePeutLaRetirer() throws Exception {
        String parAdmin = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Retrait école", "PFE", null, 20)));
        String parOrganisme = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Retrait organisme", "PFE", null, 20)));

        envoyer(patch("/api/admin/stages/offres/{id}/retirer", parAdmin), adminStages, "{\"motif\":\"Stage non rémunéré\"}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("RETIREE"));
        verify(emailService).envoyerNotification(eq(organismeValide.getEmail()), eq("Votre offre de stage a été retirée"),
            contains("Stage non rémunéré"));

        envoyer(patch("/api/stages/mes-offres/{id}/retirer", parOrganisme), organismeEnAttente, "").andExpect(status().isNotFound());
        envoyer(patch("/api/stages/mes-offres/{id}/retirer", parOrganisme), organismeValide, "")
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("RETIREE"));
        envoyer(patch("/api/stages/mes-offres/{id}/retirer", parOrganisme), organismeValide, "").andExpect(status().isConflict());

        mockMvc.perform(authentifie(get("/api/stages/offres").param("taille", "48"), etudiant))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(parAdmin))))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(parOrganisme))));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", parAdmin), etudiant)).andExpect(status().isNotFound());
    }

    @Test
    void o06_lesOffresDUnOrganismeSuspenduSontMasquees() throws Exception {
        String offre = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Avant suspension", "PFE", null, 20)));
        Organisme organisme = organismeRepository.findById(organismeValide.getOrganisme().getId()).orElseThrow();
        organisme.setStatutValidation(StatutCompte.SUSPENDU);
        organismeRepository.saveAndFlush(organisme);

        mockMvc.perform(authentifie(get("/api/stages/offres").param("taille", "48"), etudiant))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(offre))));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", offre), etudiant)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/offres/organismes"), etudiant))
            .andExpect(jsonPath("$[*].nom", not(hasItem("Valide " + lot))));
        verify(emailService, never()).envoyerNotification(eq(organismeValide.getEmail()), anyString(), anyString());
    }

    @Test
    void o07_laListeSeFiltreParTypeOrganismeLieuEtDateLimite() throws Exception {
        String pfe = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("PFE " + lot, "PFE", "Dakar Plateau", 20)));
        String inclusion = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Inclusion " + lot, "INCLUSION", "Thiès", 5)));
        String close = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Close " + lot, "PFE", "Dakar", 1)));
        offreRepository.findById(UUID.fromString(close)).ifPresent(o -> {
            o.setDateLimiteCandidature(LocalDate.now(ZoneId.of("Africa/Dakar")).minusDays(1));
            offreRepository.saveAndFlush(o);
        });
        String organisme = organismeValide.getOrganisme().getId().toString();

        mockMvc.perform(authentifie(get("/api/stages/offres").param("organisme", organisme).param("type", "PFE"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].id").value(pfe));
        mockMvc.perform(authentifie(get("/api/stages/offres").param("organisme", organisme).param("lieu", "dakar"), etudiant))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(pfe)))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(inclusion))))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(close))));
        // Les offres ouvertes d'abord, celle qui ferme le plus tôt en tête.
        mockMvc.perform(authentifie(get("/api/stages/offres").param("organisme", organisme), etudiant))
            .andExpect(jsonPath("$.contenu[0].id").value(inclusion));
        mockMvc.perform(authentifie(get("/api/stages/offres").param("organisme", organisme).param("ouvertes", "false")
                .param("taille", "1").param("page", "2"), etudiant))
            .andExpect(jsonPath("$.totalPages").value(3))
            .andExpect(jsonPath("$.contenu[0].id").value(close))
            .andExpect(jsonPath("$.contenu[0].candidaturesOuvertes").value(false));
        mockMvc.perform(authentifie(get("/api/stages/offres/organismes"), etudiant))
            .andExpect(jsonPath("$[*].nom", hasItem("Valide " + lot)));
    }

    @Test
    void o08_laListeEstReserveeAuxMembresConnectesEtLeMotifNEstPasMontreAuxEtudiants() throws Exception {
        mockMvc.perform(get("/api/stages/offres")).andExpect(status().isForbidden());
        String retiree = id(envoyer(post("/api/stages/mes-offres"), organismeValide, offre("Motif caché", "PFE", null, 20)));
        envoyer(patch("/api/admin/stages/offres/{id}/retirer", retiree), adminStages, "{\"motif\":\"Interne\"}");
        mockMvc.perform(authentifie(get("/api/admin/stages/offres/a-verifier"), adminStages))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nombre").isNumber());
        mockMvc.perform(authentifie(get("/api/stages/mes-offres"), organismeValide))
            .andExpect(jsonPath("$[0].motifDecision", containsString("Interne")));
        mockMvc.perform(authentifie(get("/api/admin/stages/offres"), etudiant)).andExpect(status().isForbidden());
    }

    private String offre(String titre, String type, String lieu, int joursAvantLimite) {
        return """
            {"titre":"%s","description":"Missions du stage","competences":"Rigueur","dureeMois":4,"typeStage":"%s",%s"dateLimiteCandidature":"%s"}
            """.formatted(titre, type, lieu == null ? "" : "\"lieu\":\"" + lieu + "\",", dans(joursAvantLimite)).trim();
    }

    private static String dans(int jours) {
        return LocalDate.now(ZoneId.of("Africa/Dakar")).plusDays(jours).toString();
    }

    private static String id(ResultActions resultat) throws Exception {
        return JsonPath.read(resultat.andReturn().getResponse().getContentAsString(), "$.id");
    }

    private Utilisateur creerCompteOrganisme(String nom, StatutCompte statut) {
        Organisme organisme = new Organisme();
        organisme.setNom(nom);
        organisme.setStatutValidation(statut);
        organisme = organismeRepository.saveAndFlush(organisme);
        organismesCrees.add(organisme.getId());
        Utilisateur compte = nouveauCompte(TypeRole.ORGANISME);
        compte.setOrganisme(organisme);
        return utilisateurRepository.saveAndFlush(compte);
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = nouveauCompte(role);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(compte);
    }

    private static Utilisateur nouveauCompte(TypeRole role) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("stages." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom("Test");
        compte.setNom(role.name());
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        return compte;
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
