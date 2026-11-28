package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
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
import ept.edu.sn.alumni_backend.admin.TypeActionAdmin;
import ept.edu.sn.alumni_backend.admin.entity.ActionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.emploi.repository.SignalementOffreEmploiRepository;
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

/**
 * Offres gérées par un organisme, candidatures des étudiants et alumni (#222), leur traitement par l'organisme (#223)
 * et la modération des offres par l'administration (#224).
 */
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
    @Autowired private SignalementOffreEmploiRepository signalementRepository;
    @Autowired private ActionAdminRepository actionAdminRepository;

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
        signalementRepository.deleteAll();
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
        // Vue candidat : CV effacé, et la clôture n'a pas fait passer la candidature par la sélection ni l'entretien.
        envoyer(get("/api/offres-emploi/{id}/ma-candidature", offre), alumni, null)
            .andExpect(jsonPath("$.cvDisponible").value(false))
            .andExpect(jsonPath("$.statutsAtteints", contains("RECUE", "NON_RETENUE")));
        envoyer(get("/api/offres-emploi/candidatures/{id}/cv", idCandidature(recente, etudiant)), etudiant, null).andExpect(status().isOk());
    }

    @Test
    void m01_seuleLAdministrationDesOffresModere() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        for (Utilisateur refuse : List.of(creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES), organisme, alumni)) {
            envoyer(get("/api/admin/offres-emploi"), refuse, null).andExpect(status().isForbidden());
            envoyer(get("/api/admin/offres-emploi/compteur"), refuse, null).andExpect(status().isForbidden());
            envoyer(patch("/api/admin/offres-emploi/{id}/retirer", offre), refuse, "{\"motif\": \"Hors charte\"}")
                .andExpect(status().isForbidden());
        }
        envoyer(get("/api/admin/offres-emploi?file=PUBLIEES"), moderateur(), null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[0].offre.id").value(offre));
        envoyer(get("/api/offres-emploi/{id}", offre), etudiant, null).andExpect(jsonPath("$.statut").value("PUBLIEE"));
    }

    @Test
    void m02_uneOffreEnAttenteEstPublieeOuRefuseeAvecUnMotif() throws Exception {
        Utilisateur nonValide = creerCompteOrganisme(StatutCompte.EN_ATTENTE);
        Utilisateur moderateur = moderateur();
        long avant = compteur(moderateur, "aVerifier");
        String aRefuser = id(envoyer(post("/api/offres-emploi/gerees"), nonValide, offreGeree(false, "[]")).andExpect(status().isCreated()));
        String aPublier = id(envoyer(post("/api/offres-emploi/gerees"), nonValide, offreGeree(false, "[]")).andExpect(status().isCreated()));
        assertThat(compteur(moderateur, "aVerifier")).isEqualTo(avant + 2);
        envoyer(get("/api/admin/tableau-de-bord"), creerCompte(TypeRole.ADMIN, PermissionAdmin.CONSULTER_TABLEAU_DE_BORD), null)
            .andExpect(jsonPath("$.aTraiter.offresEmploiAModerer").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
        envoyer(get("/api/admin/offres-emploi"), moderateur, null)
            .andExpect(jsonPath("$.contenu[*].offre.id", org.hamcrest.Matchers.hasItems(aRefuser, aPublier)));

        envoyer(patch("/api/admin/offres-emploi/{id}/refuser", aRefuser), moderateur, "{\"motif\": \"  \"}").andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/offres-emploi/{id}/refuser", aRefuser), moderateur, "{\"motif\": \" Entreprise introuvable \"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.offre.statut").value("REFUSEE"))
            .andExpect(jsonPath("$.offre.motifDecision").value("Entreprise introuvable"));
        envoyer(patch("/api/admin/offres-emploi/{id}/refuser", aRefuser), moderateur, "{\"motif\": \"Encore\"}").andExpect(status().isConflict());
        envoyer(patch("/api/admin/offres-emploi/{id}/publier", aRefuser), moderateur, null).andExpect(status().isConflict());
        envoyer(get("/api/offres-emploi/mes-offres"), nonValide, null)
            .andExpect(jsonPath("$[?(@.id == '" + aRefuser + "')].motifDecision").value("Entreprise introuvable"));

        envoyer(patch("/api/admin/offres-emploi/{id}/publier", aPublier), moderateur, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.offre.statut").value("PUBLIEE"));
        envoyer(get("/api/offres-emploi/{id}", aPublier), alumni, null).andExpect(status().isOk());
        assertThat(compteur(moderateur, "aVerifier")).isEqualTo(avant);

        assertThat(messagesPour(nonValide)).anyMatch(m -> m.contains("Motif : Entreprise introuvable"))
            .anyMatch(m -> m.contains("a été vérifiée par l'école"));
        assertThat(journal(nonValide)).extracting(ActionAdmin::getType)
            .containsExactlyInAnyOrder(TypeActionAdmin.REFUS_OFFRE_EMPLOI, TypeActionAdmin.PUBLICATION_OFFRE_EMPLOI);
        assertThat(journal(nonValide)).filteredOn(a -> a.getType() == TypeActionAdmin.REFUS_OFFRE_EMPLOI)
            .extracting(ActionAdmin::getMotif).containsExactly("Entreprise introuvable");
    }

    @Test
    void m03_lesSignalementsSontClassesEtLOffreResteePubliee() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        Utilisateur moderateur = moderateur();
        long avant = compteur(moderateur, "signalees");
        envoyer(post("/api/offres-emploi/{id}/signalements", offre), alumni, "{\"motif\": \"LIEN_MORT\"}").andExpect(status().is2xxSuccessful());
        envoyer(post("/api/offres-emploi/{id}/signalements", offre), etudiant, "{\"motif\": \"AUTRE\", \"commentaire\": \"Doublon\"}")
            .andExpect(status().is2xxSuccessful());
        assertThat(compteur(moderateur, "signalees")).isEqualTo(avant + 1);
        envoyer(get("/api/admin/offres-emploi?file=SIGNALEES"), moderateur, null)
            .andExpect(jsonPath("$.contenu[?(@.offre.id == '" + offre + "')].signalements[*].motif", org.hamcrest.Matchers.contains("LIEN_MORT", "AUTRE")));

        envoyer(patch("/api/admin/offres-emploi/{id}/classer-signalements", offre), moderateur, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.offre.statut").value("PUBLIEE"));
        envoyer(patch("/api/admin/offres-emploi/{id}/classer-signalements", offre), moderateur, null).andExpect(status().isConflict());
        assertThat(compteur(moderateur, "signalees")).isEqualTo(avant);
        envoyer(get("/api/admin/offres-emploi?file=SIGNALEES"), moderateur, null)
            .andExpect(jsonPath("$.contenu[?(@.offre.id == '" + offre + "')]", hasSize(0)));
        assertThat(journal(organisme)).extracting(ActionAdmin::getType).containsExactly(TypeActionAdmin.CLASSEMENT_SIGNALEMENTS_OFFRE_EMPLOI);
        assertThat(messagesPour(organisme)).isEmpty();
    }

    @Test
    void m04_leRetraitParLEcoleFermeLesCandidaturesEtPrevientChacun() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        Utilisateur moderateur = moderateur();
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        postuler(offre, etudiant, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", idCandidature(offre, etudiant)), organisme, statut("RETENUE"))
            .andExpect(status().isOk());
        envoyer(post("/api/offres-emploi/{id}/signalements", offre), autreOrganisme, "{\"motif\": \"ARNAQUE\"}").andExpect(status().is2xxSuccessful());

        envoyer(patch("/api/admin/offres-emploi/{id}/retirer", offre), moderateur, "{}").andExpect(status().isBadRequest());
        envoyer(patch("/api/admin/offres-emploi/{id}/retirer", offre), moderateur, "{\"motif\": \"Annonce trompeuse\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.offre.statut").value("RETIREE"))
            .andExpect(jsonPath("$.offre.motifDecision").value("Annonce trompeuse"));
        envoyer(patch("/api/admin/offres-emploi/{id}/retirer", offre), moderateur, "{\"motif\": \"Encore\"}").andExpect(status().isConflict());

        // Le candidat garde l'accès en lecture pour suivre sa candidature ; les autres membres ne voient plus l'offre.
        envoyer(get("/api/offres-emploi/{id}", offre), alumni, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("RETIREE"))
            .andExpect(jsonPath("$.signalable").value(false));
        envoyer(get("/api/offres-emploi/{id}", offre), autreOrganisme, null).andExpect(status().isNotFound());
        assertThat(candidatureRepository.findByOffreIdAndCandidatId(UUID.fromString(offre), alumni.getId()).orElseThrow().getStatut())
            .isEqualTo(StatutCandidatureEmploi.NON_RETENUE);
        assertThat(candidatureRepository.findByOffreIdAndCandidatId(UUID.fromString(offre), etudiant.getId()).orElseThrow().getStatut())
            .isEqualTo(StatutCandidatureEmploi.RETENUE);
        assertThat(messagesPour(alumni)).anyMatch(m -> m.contains("a été retirée : votre candidature est close"));
        assertThat(messagesPour(organisme)).anyMatch(m -> m.contains("Motif : Annonce trompeuse") && m.contains("candidatures sans décision sont closes"));
        assertThat(signalementRepository.findByOffreIdAndTraiteLeIsNull(UUID.fromString(offre))).isEmpty();
        assertThat(journal(organisme)).extracting(ActionAdmin::getType).containsExactly(TypeActionAdmin.RETRAIT_OFFRE_EMPLOI);
    }

    @Test
    void m05_leRetraitParLOrganismeFermeAussiSesCandidatures() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(patch("/api/offres-emploi/{id}/retirer", offre), organisme, null).andExpect(jsonPath("$.statut").value("RETIREE"));
        assertThat(candidatureRepository.findByOffreIdAndCandidatId(UUID.fromString(offre), alumni.getId()).orElseThrow().getStatut())
            .isEqualTo(StatutCandidatureEmploi.NON_RETENUE);
        assertThat(messagesPour(alumni)).anyMatch(m -> m.contains("a été retirée"));
        assertThat(journal(organisme)).isEmpty();
    }

    @Test
    void g10_mesOffresCompteLesCandidaturesEtCellesATraiter() throws Exception {
        String offre = publier(offreGeree(false, "[]"));
        String vide = publier(offreGeree(false, "[]"));
        postuler(offre, alumni, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        postuler(offre, etudiant, cv("cv.pdf"), false, null, "[]").andExpect(status().isOk());
        envoyer(patch("/api/offres-emploi/candidatures/{id}/statut", idCandidature(offre, etudiant)), organisme, statut("PRESELECTIONNEE"))
            .andExpect(status().isOk());
        envoyer(get("/api/offres-emploi/mes-offres"), organisme, null)
            .andExpect(jsonPath("$[?(@.id == '" + offre + "')].candidatures.total").value(2))
            .andExpect(jsonPath("$[?(@.id == '" + offre + "')].candidatures.aTraiter").value(1))
            .andExpect(jsonPath("$[?(@.id == '" + vide + "')].candidatures.total").value(0));
        envoyer(get("/api/offres-emploi/{id}", offre), organisme, null).andExpect(jsonPath("$.candidatures").doesNotExist());
    }

    private Utilisateur moderateur() {
        return creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_OFFRES_EMPLOI);
    }

    private long compteur(Utilisateur moderateur, String cle) throws Exception {
        Number valeur = JsonPath.read(envoyer(get("/api/admin/offres-emploi/compteur"), moderateur, null)
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(), "$." + cle);
        return valeur.longValue();
    }

    private List<String> messagesPour(Utilisateur destinataire) {
        return notificationRepository.findByDestinataire_IdOrderByCreeLeDescIdDesc(destinataire.getId(), PageRequest.of(0, 20))
            .getContent().stream().map(n -> n.getMessage()).toList();
    }

    private List<ActionAdmin> journal(Utilisateur cible) {
        return actionAdminRepository.findAll().stream().filter(a -> a.getCible().getId().equals(cible.getId())).toList();
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
