package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
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
import org.springframework.data.domain.PageRequest;
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
import ept.edu.sn.alumni_backend.emploi.StatutCandidatureEmploi;
import ept.edu.sn.alumni_backend.emploi.repository.CandidatureEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.repository.OffreEmploiRepository;
import ept.edu.sn.alumni_backend.emploi.service.TraitementCandidaturesEmploiService;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Offres gérées par un organisme, candidatures des étudiants et alumni (#222) et leur traitement par l'organisme (#223). */
@SpringBootTest
@AutoConfigureMockMvc
class CandidaturesEmploiIntegrationTests {
    private static final LocalDate AUJOURDHUI = LocalDate.now(ZoneId.of("Africa/Dakar"));
    private static final String QUESTIONS = """
        [{"intitule": "Disponible dès janvier ?", "type": "OUI_NON", "obligatoire": true},
         {"intitule": "Un projet dont vous êtes fier ?", "type": "TEXTE", "obligatoire": false}]
        """;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private OffreEmploiRepository offreRepository;
    @Autowired private CandidatureEmploiRepository candidatureRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private TraitementCandidaturesEmploiService traitementService;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private Utilisateur organisme;
    private Utilisateur autreOrganisme;
    private Utilisateur alumni;
    private Utilisateur etudiant;

    @BeforeEach
    void preparer() {
        organisme = creerCompteOrganisme(StatutCompte.ACTIF);
        autreOrganisme = creerCompteOrganisme(StatutCompte.ACTIF);
        alumni = creerCompte(TypeRole.ALUMNI);
        etudiant = creerCompte(TypeRole.ETUDIANT);
    }

    @AfterEach
    void nettoyer() {
        candidatureRepository.deleteAll();
        offreRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        utilisateurRepository.findAll().stream()
            .filter(u -> u.getOrganisme() != null && organismesCrees.contains(u.getOrganisme().getId()))
            .forEach(u -> {
                u.setOrganisme(null);
                utilisateurRepository.save(u);
            });
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void g01_seulUnOrganismePublieEtSonStatutDecideDeLaPublication() throws Exception {
        envoyer(post("/api/offres-emploi/gerees"), organisme, offreGeree(true, QUESTIONS))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.mode").value("GEREE"))
            .andExpect(jsonPath("$.statut").value("PUBLIEE"))
            .andExpect(jsonPath("$.entreprise").value(organisme.getOrganisme().getNom()))
            .andExpect(jsonPath("$.lettreExigee").value(true))
            .andExpect(jsonPath("$.questions", hasSize(2)))
            .andExpect(jsonPath("$.questions[0].type").value("OUI_NON"))
            .andExpect(jsonPath("$.modifiable").value(true));

        String soumise = id(envoyer(post("/api/offres-emploi/gerees"), creerCompteOrganisme(StatutCompte.EN_ATTENTE), offreGeree(false, "[]"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.statut").value("SOUMISE")));
        envoyer(get("/api/offres-emploi/{id}", soumise), alumni, null).andExpect(status().isNotFound());

        envoyer(post("/api/offres-emploi/gerees"), creerCompteOrganisme(StatutCompte.SUSPENDU), offreGeree(false, "[]"))
            .andExpect(status().isForbidden());
        envoyer(post("/api/offres-emploi/gerees"), alumni, offreGeree(false, "[]")).andExpect(status().isForbidden());
        envoyer(post("/api/offres-emploi/gerees"), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_OFFRES_EMPLOI), offreGeree(false, "[]"))
            .andExpect(status().isForbidden());
    }

    @Test
    void g02_lOrganismeGereSonOffreEtPasUnAutre() throws Exception {
        String offre = publier(offreGeree(false, QUESTIONS));
        envoyer(get("/api/offres-emploi/{id}", offre), organisme, null).andExpect(jsonPath("$.modifiable").value(true));
        envoyer(get("/api/offres-emploi/mes-offres"), organisme, null).andExpect(jsonPath("$", hasSize(1)));
        envoyer(get("/api/offres-emploi/{id}", offre), autreOrganisme, null)
            .andExpect(jsonPath("$.modifiable").value(false))
            .andExpect(jsonPath("$.signalable").value(true));
        envoyer(put("/api/offres-emploi/{id}/geree", offre), autreOrganisme, offreGeree(false, QUESTIONS)).andExpect(status().isNotFound());
        envoyer(put("/api/offres-emploi/{id}/geree", offre), organisme, offreGeree(true, "[]"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.questions", hasSize(0)));
        envoyer(patch("/api/offres-emploi/{id}/retirer", offre), organisme, null).andExpect(jsonPath("$.statut").value("RETIREE"));
    }

    @Test
    void g03_unCandidatPostuleUneSeuleFoisAvecCvEtReponsesObligatoires() throws Exception {
        String offre = publier(offreGeree(false, QUESTIONS));
        List<String> questions = JsonPath.read(envoyer(get("/api/offres-emploi/{id}", offre), alumni, null)
            .andReturn().getResponse().getContentAsString(), "$.questions[*].id");
        envoyer(get("/api/offres-emploi/{id}/ma-candidature", offre), alumni, null).andExpect(status().isNoContent());

        postuler(offre, alumni, null, false, null, reponses(questions.get(0), "OUI"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Joignez votre CV en PDF."));
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Répondez à la question : « Disponible dès janvier ? »"));
        postuler(offre, alumni, cv("cv.pdf"), false, null, reponses(questions.get(0), "Peut-être"))
            .andExpect(status().isBadRequest());
        postuler(offre, alumni, cv("cv.pdf"), false, "Ma lettre", reponses(questions.get(0), "OUI"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("RECUE"))
            .andExpect(jsonPath("$.nomCv").value("cv.pdf"))
            .andExpect(jsonPath("$.reponses", hasSize(1)))
            .andExpect(jsonPath("$.reponses[0].valeur").value("OUI"))
            .andExpect(jsonPath("$.retirable").value(true));
        postuler(offre, alumni, cv("cv.pdf"), false, null, reponses(questions.get(0), "NON"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous avez déjà postulé à cette offre."));
        envoyer(get("/api/offres-emploi/mes-candidatures"), alumni, null)
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].entreprise").value(organisme.getOrganisme().getNom()));

        postuler(offre, autreOrganisme, cv("cv.pdf"), false, null, reponses(questions.get(0), "OUI")).andExpect(status().isForbidden());
        postuler(offre, creerCompte(TypeRole.PERSONNEL), cv("cv.pdf"), false, null, reponses(questions.get(0), "OUI"))
            .andExpect(status().isForbidden());
    }

    @Test
    void g04_laLettreExigeeLExpirationEtLesOffresRelayeesSontRespectees() throws Exception {
        String offre = publier(offreGeree(true, "[]"));
        postuler(offre, etudiant, cv("cv.pdf"), false, "  ", "[]")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Cette offre exige une lettre de motivation."));

        var entite = offreRepository.findById(UUID.fromString(offre)).orElseThrow();
        entite.setDateExpiration(AUJOURDHUI.minusDays(1));
        offreRepository.saveAndFlush(entite);
        postuler(offre, etudiant, cv("cv.pdf"), false, "Lettre", "[]")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("La date d'expiration de cette offre est passée."));

        String relayee = id(envoyer(post("/api/offres-emploi/relayees"), alumni, """
            {"titre": "Relayée", "description": "D", "entreprise": "E", "typeContrat": "CDI", "lieu": "Dakar",
             "dateExpiration": "%s", "lienSource": "https://exemple.sn/offre"}
            """.formatted(AUJOURDHUI.plusDays(10))).andExpect(status().isCreated()));
        postuler(relayee, etudiant, cv("cv.pdf"), false, null, "[]")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Pour cette offre, postulez sur l'annonce d'origine."));
    }

    @Test
    void g05_leCandidatRetireTantQueCeNEstPasTraiteEtRepostuleAvecSonDernierCv() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        envoyer(get("/api/offres-emploi/mon-dernier-cv"), etudiant, null).andExpect(status().isNoContent());
        postuler(offre, etudiant, cv("mon-cv.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(get("/api/offres-emploi/mon-dernier-cv"), etudiant, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nomCv").value("mon-cv.pdf"));

        envoyer(patch("/api/offres-emploi/{id}/candidature/retirer", offre), etudiant, null)
            .andExpect(jsonPath("$.statut").value("RETIREE"))
            .andExpect(jsonPath("$.retirable").value(false));
        envoyer(patch("/api/offres-emploi/{id}/candidature/retirer", offre), etudiant, null).andExpect(status().isConflict());

        String autre = publier(offreGeree(false, "[]"));
        postuler(autre, etudiant, null, true, null, "[]")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nomCv").value("mon-cv.pdf"));
        postuler(offre, etudiant, null, false, null, "[]")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("RECUE"));

        var candidature = candidatureRepository.findByOffreIdAndCandidatId(UUID.fromString(offre), etudiant.getId()).orElseThrow();
        candidature.setStatut(StatutCandidatureEmploi.PRESELECTIONNEE);
        candidatureRepository.saveAndFlush(candidature);
        envoyer(patch("/api/offres-emploi/{id}/candidature/retirer", offre), etudiant, null)
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Le recruteur a déjà traité cette candidature : elle ne peut plus être retirée."));
    }

    @Test
    void g06_leCvNestLisibleQueDuCandidatDeLOrganismeEtDeLAdministration() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        String candidature = id(postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk()));
        for (Utilisateur autorise : List.of(alumni, organisme, creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_OFFRES_EMPLOI))) {
            envoyer(get("/api/offres-emploi/candidatures/{id}/cv", candidature), autorise, null)
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF));
        }
        for (Utilisateur refuse : List.of(autreOrganisme, etudiant, creerCompte(TypeRole.ADMIN))) {
            envoyer(get("/api/offres-emploi/candidatures/{id}/cv", candidature), refuse, null).andExpect(status().isNotFound());
        }
        envoyer(patch("/api/offres-emploi/{id}/candidature/retirer", offre), alumni, null).andExpect(status().isOk());
        envoyer(get("/api/offres-emploi/candidatures/{id}/cv", candidature), organisme, null).andExpect(status().isNotFound());
    }

    @Test
    void g07_lesQuestionsSontFigeesDesQuUnCandidatARepondu() throws Exception {
        String offre = publier(offreGeree(false, QUESTIONS));
        List<String> questions = JsonPath.read(envoyer(get("/api/offres-emploi/{id}", offre), etudiant, null)
            .andReturn().getResponse().getContentAsString(), "$.questions[*].id");
        postuler(offre, etudiant, cv("cv.pdf"), false, null, reponses(questions.get(0), "OUI")).andExpect(status().isOk());
        envoyer(put("/api/offres-emploi/{id}/geree", offre), organisme, offreGeree(false, "[]"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Des candidats ont déjà répondu : les questions ne peuvent plus changer."));
        envoyer(put("/api/offres-emploi/{id}/geree", offre), organisme, offreGeree(true, QUESTIONS))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lettreExigee").value(true));
    }

    @Test
    void t01_seulsLOrganismeDeLOffreEtLAdministrationVoientLesCandidatures() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("cv-alumni.pdf"), false, "Lettre", "[]").andExpect(status().isOk());
        postuler(offre, etudiant, cv("cv-etudiant.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(patch("/api/offres-emploi/{id}/candidature/retirer", offre), etudiant, null).andExpect(status().isOk());

        envoyer(get("/api/offres-emploi/{id}/candidatures", offre), organisme, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].candidat.id").value(alumni.getId().toString()))
            .andExpect(jsonPath("$[0].candidat.role").value("ALUMNI"))
            .andExpect(jsonPath("$[0].statut").value("RECUE"))
            .andExpect(jsonPath("$[0].statutsSuivants", hasSize(4)))
            .andExpect(jsonPath("$[0].cvDisponible").value(true))
            .andExpect(jsonPath("$[0].lettreMotivation").value("Lettre"))
            .andExpect(jsonPath("$[0].historique", hasSize(1)))
            .andExpect(jsonPath("$[0].historique[0].auteur").value("le candidat"));
        envoyer(get("/api/offres-emploi/{id}/candidatures", offre), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_OFFRES_EMPLOI), null)
            .andExpect(status().isOk());
        envoyer(get("/api/offres-emploi/{id}", offre), organisme, null).andExpect(jsonPath("$.candidaturesConsultables").value(true));
        envoyer(get("/api/offres-emploi/{id}", offre), alumni, null).andExpect(jsonPath("$.candidaturesConsultables").value(false));
        for (Utilisateur refuse : List.of(autreOrganisme, alumni, creerCompte(TypeRole.ADMIN), creerCompte(TypeRole.PERSONNEL))) {
            envoyer(get("/api/offres-emploi/{id}/candidatures", offre), refuse, null).andExpect(status().isNotFound());
        }
        String candidature = idCandidature(offre, alumni);
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", candidature), autreOrganisme, statut("RETENUE"))
            .andExpect(status().isNotFound());
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", candidature), alumni, statut("RETENUE"))
            .andExpect(status().isNotFound());
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", idCandidature(offre, etudiant)), organisme, statut("RETENUE"))
            .andExpect(status().isNotFound());
    }

    @Test
    void t02_leStatutAvanceSansRevenirEnArriereAvecHistoriqueEtNotification() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        String candidature = idCandidature(offre, alumni);
        String url = "/api/offres-emploi/candidatures/{id}/statut";

        envoyer(patch(url, candidature), organisme, statut("PRESELECTIONNEE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PRESELECTIONNEE"))
            .andExpect(jsonPath("$.statutsSuivants", hasSize(3)));
        envoyer(patch(url, candidature), organisme, statut("RECUE"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce changement de statut n'est pas possible : le traitement ne revient pas en arrière."));
        envoyer(patch(url, candidature), organisme, statut("ENTRETIEN")).andExpect(status().isOk());
        envoyer(patch(url, candidature), organisme, statut("RETENUE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutsSuivants", hasSize(0)))
            .andExpect(jsonPath("$.historique", hasSize(4)))
            .andExpect(jsonPath("$.historique[3].statut").value("RETENUE"))
            .andExpect(jsonPath("$.historique[3].auteur").value(organisme.getOrganisme().getNom()));
        for (String autre : List.of("RECUE", "NON_RETENUE", "RETIREE")) {
            envoyer(patch(url, candidature), organisme, statut(autre)).andExpect(status().isConflict());
        }
        envoyer(patch(url, candidature), organisme, "{}").andExpect(status().isBadRequest());

        envoyer(get("/api/offres-emploi/{id}/ma-candidature", offre), alumni, null)
            .andExpect(jsonPath("$.statut").value("RETENUE"))
            .andExpect(jsonPath("$.retirable").value(false));
        var notifications = notificationRepository.findByDestinataire_IdOrderByCreeLeDescIdDesc(alumni.getId(), PageRequest.of(0, 10)).getContent();
        assertThat(notifications).hasSize(3).allSatisfy(n -> assertThat(n.getType()).isEqualTo(TypeNotification.EMPLOI));
        assertThat(notifications.getFirst().getMessage()).contains("est retenue");

        // Une étape peut être sautée : une candidature reçue est directement non retenue.
        postuler(offre, etudiant, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(patch(url, idCandidature(offre, etudiant)), organisme, statut("NON_RETENUE"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("NON_RETENUE"));
    }

    @Test
    void t03_laNotePriveeResteEntreRecruteurs() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        String candidature = idCandidature(offre, alumni);
        String url = "/api/offres-emploi/candidatures/{id}/note";
        envoyer(put(url, candidature), organisme, "{\"note\": \"  Très bon profil réseau  \"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notePrivee").value("Très bon profil réseau"));
        envoyer(get("/api/offres-emploi/{id}/candidatures", offre), organisme, null)
            .andExpect(jsonPath("$[0].notePrivee").value("Très bon profil réseau"));
        assertThat(envoyer(get("/api/offres-emploi/{id}/ma-candidature", offre), alumni, null).andReturn().getResponse().getContentAsString())
            .doesNotContain("Très bon profil").doesNotContain("note");
        assertThat(envoyer(get("/api/offres-emploi/mes-candidatures"), alumni, null).andReturn().getResponse().getContentAsString())
            .doesNotContain("Très bon profil");
        envoyer(put(url, candidature), alumni, "{\"note\": \"x\"}").andExpect(status().isNotFound());
        envoyer(put(url, candidature), organisme, "{\"note\": \"" + "x".repeat(2001) + "\"}").andExpect(status().isBadRequest());
        envoyer(put(url, candidature), organisme, "{\"note\": \"\"}").andExpect(jsonPath("$.notePrivee").doesNotExist());
    }

    @Test
    void t04_laClotureNonRetientLesCandidaturesOuvertesEtFigeLOffre() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        postuler(offre, etudiant, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", idCandidature(offre, alumni)), organisme, statut("RETENUE"))
            .andExpect(status().isOk());

        envoyer(post("/api/offres-emploi/{id}/cloturer", offre), autreOrganisme, null).andExpect(status().isNotFound());
        envoyer(post("/api/offres-emploi/{id}/cloturer", offre), alumni, null).andExpect(status().isNotFound());
        envoyer(post("/api/offres-emploi/{id}/cloturer", offre), organisme, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nonRetenues").value(1));
        envoyer(post("/api/offres-emploi/{id}/cloturer", offre), organisme, null).andExpect(status().isConflict());

        envoyer(get("/api/offres-emploi/{id}/ma-candidature", offre), etudiant, null).andExpect(jsonPath("$.statut").value("NON_RETENUE"));
        envoyer(get("/api/offres-emploi/{id}/ma-candidature", offre), alumni, null).andExpect(jsonPath("$.statut").value("RETENUE"));
        envoyer(get("/api/offres-emploi/{id}", offre), etudiant, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.cloturee").value(true));
        envoyer(get("/api/offres-emploi/{id}", offre), organisme, null)
            .andExpect(jsonPath("$.modifiable").value(false))
            .andExpect(jsonPath("$.candidaturesConsultables").value(true));
        envoyer(get("/api/offres-emploi"), etudiant, null).andExpect(jsonPath("$.contenu", hasSize(0)));
        envoyer(get("/api/offres-emploi?expirees=true"), etudiant, null).andExpect(jsonPath("$.contenu", hasSize(1)));
        envoyer(put("/api/offres-emploi/{id}/geree", offre), organisme, offreGeree(false, "[]")).andExpect(status().isConflict());
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", idCandidature(offre, etudiant)), organisme, statut("RETENUE"))
            .andExpect(status().isConflict());
        postuler(offre, creerCompte(TypeRole.ALUMNI), cv("cv.pdf"), false, null, "[]")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Le recrutement de cette offre est clôturé."));
        assertThat(notificationRepository.findByDestinataire_IdOrderByCreeLeDescIdDesc(etudiant.getId(), PageRequest.of(0, 10))
            .getContent().getFirst().getMessage()).contains("est non retenue");
    }

    @Test
    void t05_lesCvSontEffacesApresLaDureeDeConservation() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        String recente = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("ancien.pdf"), false, null, "[]").andExpect(status().isOk());
        postuler(recente, etudiant, cv("recent.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(post("/api/offres-emploi/{id}/cloturer", offre), organisme, null).andExpect(status().isOk());
        envoyer(post("/api/offres-emploi/{id}/cloturer", recente), organisme, null).andExpect(status().isOk());
        var entite = offreRepository.findById(UUID.fromString(offre)).orElseThrow();
        entite.setClotureeLe(Instant.now().minus(Duration.ofDays(200)));
        offreRepository.saveAndFlush(entite);

        traitementService.purgerCv();

        envoyer(get("/api/offres-emploi/candidatures/{id}/cv", idCandidature(offre, alumni)), alumni, null).andExpect(status().isNotFound());
        envoyer(get("/api/offres-emploi/{id}/candidatures", offre), organisme, null)
            .andExpect(jsonPath("$[0].cvDisponible").value(false))
            .andExpect(jsonPath("$[0].statut").value("NON_RETENUE"));
        envoyer(get("/api/offres-emploi/mon-dernier-cv"), alumni, null).andExpect(status().isNoContent());
        envoyer(get("/api/offres-emploi/candidatures/{id}/cv", idCandidature(recente, etudiant)), etudiant, null).andExpect(status().isOk());
    }

    private String idCandidature(String offreId, Utilisateur candidat) {
        return candidatureRepository.findByOffreIdAndCandidatId(UUID.fromString(offreId), candidat.getId()).orElseThrow().getId().toString();
    }

    private static String statut(String statut) {
        return "{\"statut\": \"" + statut + "\"}";
    }

    private String publier(String corps) throws Exception {
        return id(envoyer(post("/api/offres-emploi/gerees"), organisme, corps).andExpect(status().isCreated()));
    }

    private ResultActions postuler(String offreId, Utilisateur auteur, MockMultipartFile cv, boolean reprendre, String lettre,
            String reponses) throws Exception {
        MockMultipartHttpServletRequestBuilder requete = multipart("/api/offres-emploi/{id}/candidature", offreId);
        if (cv != null) requete.file(cv);
        if (reprendre) requete.part(new MockPart("reprendreCv", "true".getBytes(StandardCharsets.UTF_8)));
        if (lettre != null) requete.part(new MockPart("lettre", lettre.getBytes(StandardCharsets.UTF_8)));
        requete.file(new MockMultipartFile("reponses", "", MediaType.APPLICATION_JSON_VALUE, reponses.getBytes(StandardCharsets.UTF_8)));
        return envoyer(requete, auteur, null);
    }

    private static String reponses(String questionId, String valeur) {
        return "[{\"questionId\": \"" + questionId + "\", \"valeur\": \"" + valeur + "\"}]";
    }

    private static String offreGeree(boolean lettreExigee, String questions) {
        return """
            {"titre": "Ingénieur réseaux", "description": "Exploitation du réseau", "typeContrat": "CDI", "lieu": "Dakar",
             "dateExpiration": "%s", "competences": ["Linux"], "filieres": [], "lettreExigee": %s, "questions": %s}
            """.formatted(AUJOURDHUI.plusDays(30), lettreExigee, questions);
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
        compte.setEmail("candidatures-emploi." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom("Test");
        compte.setNom(role.name());
        compte.setRole(role);
        compte.setStatutCompte(StatutCompte.ACTIF);
        compte.setEmailVerifie(true);
        return compte;
    }

    private ResultActions envoyer(AbstractMockHttpServletRequestBuilder<?> requete, Utilisateur auteur, String corps) throws Exception {
        String jeton = jwtService.genererToken(new UtilisateurPrincipal(auteur));
        requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jeton);
        if (corps != null) {
            requete.contentType(MediaType.APPLICATION_JSON).content(corps);
        }
        return mockMvc.perform(requete);
    }
}
