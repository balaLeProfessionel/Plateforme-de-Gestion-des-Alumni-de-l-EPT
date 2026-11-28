package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.Classe;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.mobilite.ActionHistorique;
import ept.edu.sn.alumni_backend.mobilite.repository.CandidatureMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.HistoriqueMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.PieceCandidatureMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.OffreMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.PieceJointeOffreMobiliteRepository;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Candidatures aux offres de mobilité : dépôt, renvoi, retrait, droits sur les pièces, conditions figées. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class CandidaturesMobiliteIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private OffreMobiliteRepository offreRepository;
    @Autowired private PieceJointeOffreMobiliteRepository pieceRepository;
    @Autowired private HistoriqueMobiliteRepository historiqueRepository;
    @Autowired private CandidatureMobiliteRepository candidatureRepository;
    @Autowired private PieceCandidatureMobiliteRepository pieceCandidatureRepository;
    @Autowired private NotificationRepository notificationRepository;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private final List<UUID> comptesCrees = new ArrayList<>();
    private Filiere informatique;
    private Filiere civil;
    private Utilisateur institut;
    private Utilisateur autreInstitut;
    private Utilisateur chef;
    private Utilisateur adminStages;
    private Utilisateur etudiantInfo;
    private Utilisateur etudiantCivil;
    private Utilisateur enseignant;
    private Utilisateur alumni;

    @BeforeEach
    void preparer() {
        informatique = FilieresDeTest.filiere(filiereRepository, "Génie informatique et télécommunications");
        civil = FilieresDeTest.filiere(filiereRepository, "Génie civil");
        institut = creerInstitut(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT, StatutCompte.ACTIF);
        autreInstitut = creerInstitut(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT, StatutCompte.ACTIF);
        chef = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_MOBILITES);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        etudiantInfo = creerEtudiant(informatique, Classe.DIC2);
        etudiantCivil = creerEtudiant(civil, Classe.DIC1);
        enseignant = creerCompte(TypeRole.PERSONNEL);
        alumni = creerCompte(TypeRole.ALUMNI);
    }

    @AfterEach
    void nettoyer() {
        historiqueRepository.deleteAll();
        pieceCandidatureRepository.deleteAll();
        candidatureRepository.deleteAll();
        pieceRepository.deleteAll();
        offreRepository.deleteAll();
        notificationRepository.deleteAll(notificationRepository.findAll().stream()
            .filter(n -> comptesCrees.contains(n.getDestinataire().getId())).toList());
        utilisateurRepository.deleteAllById(comptesCrees);
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void c01_unEtudiantEligibleDeposeSonDossierPuisRemplaceUnePiece() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("LETTRE_MOTIVATION", "lettre.pdf")).file(pdf("RELEVES_NOTES", "releves.pdf")), etudiantInfo))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("SOUMISE"))
            .andExpect(jsonPath("$.pieces", hasSize(2)))
            .andExpect(jsonPath("$.modifiable").value(true));
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("RELEVES_NOTES", "releves-corriges.pdf")), etudiantInfo))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pieces[?(@.type == 'RELEVES_NOTES')].nom").value(hasItem("releves-corriges.pdf")));
        assertThat(candidatureRepository.count()).isEqualTo(1);
        assertThat(historiqueRepository.findAll()).extracting(h -> h.getAction())
            .containsOnlyOnce(ActionHistorique.SOUMISSION_CANDIDATURE);
        mockMvc.perform(authentifie(get("/api/mobilites/mes-candidatures"), etudiantInfo))
            .andExpect(jsonPath("$[0].offre.id").value(offre));
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}/ma-candidature", offre), etudiantCivil)).andExpect(status().isNoContent());
    }

    @Test
    void c02_unDossierIncompletOuUnCandidatNonAdmisEstRefuse() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(informatique.getId().toString()), List.of()));
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre).file(pdf("LETTRE_MOTIVATION", "lettre.pdf")), etudiantInfo))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Pièces manquantes : RELEVES_NOTES."));
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("LETTRE_MOTIVATION", "l.pdf")).file(pdf("RELEVES_NOTES", "r.pdf")).file(pdf("CV", "cv.pdf")), etudiantInfo))
            .andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("LETTRE_MOTIVATION", "l.pdf")).file(pdf("RELEVES_NOTES", "r.pdf")), etudiantCivil))
            .andExpect(status().isConflict());
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("LETTRE_MOTIVATION", "l.pdf")).file(pdf("RELEVES_NOTES", "r.pdf")), enseignant))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("LETTRE_MOTIVATION", "l.pdf")).file(pdf("RELEVES_NOTES", "r.pdf")), alumni))
            .andExpect(status().isForbidden());
        assertThat(candidatureRepository.count()).isZero();
    }

    @Test
    void c03_leCandidatRetireEtRenvoieSansRedeposerPuisPlusApresLaCloture() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        deposer(offre, etudiantInfo);
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/candidature/retirer", offre), etudiantInfo))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("RETIREE"));
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre), etudiantInfo))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("SOUMISE")).andExpect(jsonPath("$.pieces", hasSize(2)));

        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/candidature/retirer", offre), etudiantInfo)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}/ma-candidature", offre), etudiantInfo))
            .andExpect(jsonPath("$.modifiable").value(false));
    }

    @Test
    void c04_lesPiecesNeSeLisentQueParLeCandidatEtLeChef() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String reponse = deposer(offre, etudiantInfo);
        String candidature = JsonPath.read(reponse, "$.id");
        String piece = JsonPath.read(reponse, "$.pieces[0].id");
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", candidature, piece), etudiantInfo))
            .andExpect(status().isOk()).andExpect(content().contentType(MediaType.APPLICATION_PDF));
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", candidature, piece), chef)).andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", candidature, piece), etudiantCivil)).andExpect(status().isNotFound());
        // L'institut ne lit le dossier que d'un candidat retenu (tranche des décisions).
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", candidature, piece), institut)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", candidature, piece), adminStages)).andExpect(status().isNotFound());
    }

    @Test
    void c05_avecDesCandidaturesSeulesLaDateEtLesPlacesAugmententEncore() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        deposer(offre, etudiantInfo);
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", offre), institut)).andExpect(jsonPath("$.nombreCandidatures").value(1));
        envoyer(put("/api/mobilites/offres/{id}", offre), institut, corps("ETUDIANTS", List.of(), List.of()).replace("Canada", "France"))
            .andExpect(status().isConflict());
        envoyer(put("/api/mobilites/offres/{id}", offre), institut, corps("ETUDIANTS", List.of(), List.of()).replace("\"nombrePlaces\":3", "\"nombrePlaces\":2"))
            .andExpect(status().isConflict());
        String plusTard = LocalDate.now(ZoneId.of("Africa/Dakar")).plusDays(40).toString();
        envoyer(put("/api/mobilites/offres/{id}", offre), chef, corps("ETUDIANTS", List.of(), List.of())
                .replace("\"nombrePlaces\":3", "\"nombrePlaces\":5").replace(demain(), plusTard))
            .andExpect(status().isOk()).andExpect(jsonPath("$.nombrePlaces").value(5)).andExpect(jsonPath("$.dateLimite").value(plusTard));
    }

    @Test
    void c06_leRetraitDeLOffrePrevientLesCandidats() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        deposer(offre, etudiantInfo);
        long avant = notificationRepository.countByDestinataire_IdAndLueFalse(etudiantInfo.getId());
        envoyer(patch("/api/admin/mobilites/offres/{id}/retirer", offre), chef, "{\"motif\":\"Partenariat suspendu\"}").andExpect(status().isOk());
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(etudiantInfo.getId())).isEqualTo(avant + 1);
        mockMvc.perform(authentifie(get("/api/mobilites/mes-candidatures"), etudiantInfo))
            .andExpect(jsonPath("$[0].offre.statut").value("RETIREE"));
    }

    private String deposer(String offre, Utilisateur candidat) throws Exception {
        return mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/candidature", offre)
                .file(pdf("LETTRE_MOTIVATION", "lettre.pdf")).file(pdf("RELEVES_NOTES", "releves.pdf")), candidat))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
    }

    private String publier(Utilisateur auteur, String corps) throws Exception {
        return JsonPath.read(envoyer(post("/api/mobilites/mes-offres"), auteur, corps)
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    private static String demain() {
        return LocalDate.now(ZoneId.of("Africa/Dakar")).plusDays(20).toString();
    }

    private static String corps(String publicVise, List<String> filieres, List<String> classes) {
        return """
            {"titre":"Semestre d'échange","description":"Cours en génie logiciel","type":"ECHANGE","publicVise":"%s",
             "pays":"Canada","ville":"Québec","anneeUniversitaire":"2027-2028","periode":"SEMESTRE_1","nombrePlaces":3,
             "dateLimite":"%s","filiereIds":%s,"classes":%s,"piecesDemandees":["LETTRE_MOTIVATION","RELEVES_NOTES"]}
            """.formatted(publicVise, demain(), json(filieres), json(classes));
    }

    private static String json(List<String> valeurs) {
        return valeurs.stream().map(v -> "\"" + v + "\"").reduce((a, b) -> a + "," + b).map(v -> "[" + v + "]").orElse("[]");
    }

    private org.springframework.test.web.servlet.ResultActions envoyer(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private static MockMultipartFile pdf(String partie, String nom) {
        return new MockMultipartFile(partie, nom, "application/pdf", "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
    }

    private Utilisateur creerInstitut(TypeOrganisme type, StatutCompte statut) {
        Organisme entite = new Organisme();
        entite.setNom("Institut " + UUID.randomUUID());
        entite.setTypeOrganisme(type);
        entite.setStatutValidation(statut);
        entite = organismeRepository.saveAndFlush(entite);
        organismesCrees.add(entite.getId());
        Utilisateur compte = nouveauCompte(TypeRole.ORGANISME);
        compte.setOrganisme(entite);
        return enregistrer(compte);
    }

    private Utilisateur creerEtudiant(Filiere filiere, Classe classe) {
        Utilisateur compte = nouveauCompte(TypeRole.ETUDIANT);
        compte.setFiliere(filiere);
        compte.setClasse(classe);
        return enregistrer(compte);
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = nouveauCompte(role);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return enregistrer(compte);
    }

    private Utilisateur enregistrer(Utilisateur compte) {
        Utilisateur enregistre = utilisateurRepository.saveAndFlush(compte);
        comptesCrees.add(enregistre.getId());
        return enregistre;
    }

    private static Utilisateur nouveauCompte(TypeRole role) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("mobilite." + UUID.randomUUID() + "@example.invalid");
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
