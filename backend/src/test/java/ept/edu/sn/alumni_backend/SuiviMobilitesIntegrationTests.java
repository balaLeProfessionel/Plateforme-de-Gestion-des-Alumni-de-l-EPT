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
import ept.edu.sn.alumni_backend.mobilite.StatutMobilite;
import ept.edu.sn.alumni_backend.mobilite.repository.CandidatureMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.HistoriqueMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.MobiliteRepository;
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

/** Suivi des mobilités, mobilité entrante (proposée par l'institut ou saisie par le chef) et flux par partenaire. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class SuiviMobilitesIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private OffreMobiliteRepository offreRepository;
    @Autowired private PieceJointeOffreMobiliteRepository pieceRepository;
    @Autowired private HistoriqueMobiliteRepository historiqueRepository;
    @Autowired private CandidatureMobiliteRepository candidatureRepository;
    @Autowired private MobiliteRepository mobiliteRepository;
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
    private Utilisateur etudiant3;

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
        etudiant3 = creerEtudiant(civil, Classe.DIC2);
    }

    @AfterEach
    void nettoyer() {
        historiqueRepository.deleteAll();
        mobiliteRepository.deleteAll();
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
    void s01_leChefFaitAvancerUneMobiliteSortanteDansLOrdre() throws Exception {
        String mobilite = mobiliteSortante();
        statut(mobilite, "TERMINEE", null).andExpect(status().isConflict());
        statut(mobilite, "EN_COURS", null).andExpect(status().isOk()).andExpect(jsonPath("$.dateDebut").isNotEmpty());
        statut(mobilite, "ANNULEE", null).andExpect(status().isBadRequest());
        statut(mobilite, "TERMINEE", null).andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("TERMINEE"));
        statut(mobilite, "EN_COURS", null).andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/admin/mobilites/mobilites/{id}/historique", mobilite), chef))
            .andExpect(jsonPath("$[*].action", hasItem("PUBLICATION_OFFRE")))
            .andExpect(jsonPath("$[*].action", hasItem("DECISION_CANDIDATURE")))
            .andExpect(jsonPath("$[*].details", hasItem("EN_COURS → TERMINEE")));
        mockMvc.perform(authentifie(get("/api/admin/mobilites/mobilites/{id}/historique", mobilite), adminStages)).andExpect(status().isForbidden());
    }

    @Test
    void s02_lInstitutProposeUnEtudiantQueLeChefAccepteOuRefuse() throws Exception {
        String proposition = JsonPath.read(envoyer(post("/api/mobilites/accueils"), institut, accueil("Marie"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.statut").value("PROPOSEE"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(chef.getId())).isEqualTo(1);
        envoyer(put("/api/mobilites/accueils/{id}", proposition), autreInstitut, accueil("Intrus")).andExpect(status().isNotFound());
        envoyer(put("/api/mobilites/accueils/{id}", proposition), institut, accueil("Marie-Ève"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.personne.prenom").value("Marie-Ève"));
        envoyer(post("/api/mobilites/accueils"), etudiantInfo, accueil("Non")).andExpect(status().isForbidden());

        mockMvc.perform(authentifie(patch("/api/admin/mobilites/mobilites/{id}/accepter", proposition), chef))
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("PREVUE"));
        envoyer(put("/api/mobilites/accueils/{id}", proposition), institut, accueil("Tard")).andExpect(status().isConflict());

        String autre = JsonPath.read(envoyer(post("/api/mobilites/accueils"), institut, accueil("Paul"))
            .andReturn().getResponse().getContentAsString(), "$.id");
        envoyer(patch("/api/admin/mobilites/mobilites/{id}/refuser", autre), chef, "{\"motif\":\"Filière complète\"}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.statut").value("REFUSEE")).andExpect(jsonPath("$.motif").value("Filière complète"));
        mockMvc.perform(authentifie(get("/api/mobilites/mes-mobilites"), institut)).andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(authentifie(get("/api/mobilites/mes-mobilites"), autreInstitut)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void s03_lesFluxComptentLesMobilitesParPartenaireEtParSens() throws Exception {
        mobiliteSortante();
        String nom = "Université sans compte " + UUID.randomUUID();
        String saisie = "{\"nomNouvelOrganisme\":\"" + nom + "\",\"accueil\":" + accueil("Awa") + "}";
        String reponse = envoyer(post("/api/admin/mobilites/mobilites/entrantes"), chef, saisie)
            .andExpect(status().isCreated()).andExpect(jsonPath("$.statut").value("PREVUE")).andReturn().getResponse().getContentAsString();
        organismesCrees.add(UUID.fromString(JsonPath.read(reponse, "$.organisme.id")));
        // Une proposition non traitée ne compte pas.
        envoyer(post("/api/mobilites/accueils"), institut, accueil("Paul")).andExpect(status().isCreated());

        mockMvc.perform(authentifie(get("/api/admin/mobilites/flux").param("annee", "2027-2028"), chef))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.sortantes").value(1))
            .andExpect(jsonPath("$.entrantes").value(1))
            .andExpect(jsonPath("$.lignes[?(@.organisme == '" + nom + "')].entrantes").value(hasItem(1)));
        mockMvc.perform(authentifie(get("/api/admin/mobilites/mobilites").param("sens", "ENTRANTE").param("statut", "PROPOSEE"), chef))
            .andExpect(jsonPath("$.contenu", hasSize(1)));
    }

    /** Une candidature retenue sur une liste publiée : renvoie l'identifiant de la mobilité sortante créée. */
    private String mobiliteSortante() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String candidature = JsonPath.read(deposer(offre, etudiantInfo), "$.id");
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());
        decider(candidature, "RETENUE").andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/offres/{id}/liste/publier", offre), chef)).andExpect(status().isOk());
        return mobiliteRepository.findByCandidature_Id(UUID.fromString(candidature)).orElseThrow().getId().toString();
    }

    private org.springframework.test.web.servlet.ResultActions statut(String mobilite, String statut, String motif) throws Exception {
        return envoyer(patch("/api/admin/mobilites/mobilites/{id}/statut", mobilite), chef,
            "{\"statut\":\"" + statut + "\"" + (motif == null ? "" : ",\"motif\":\"" + motif + "\"") + "}");
    }

    private String accueil(String prenom) {
        return """
            {"prenom":"%s","nom":"Tremblay","email":"etudiant@example.invalid","programmeOrigine":"Génie logiciel",
             "filiereAccueilId":"%s","type":"ECHANGE","anneeUniversitaire":"2027-2028"}
            """.formatted(prenom, informatique.getId());
    }

    private org.springframework.test.web.servlet.ResultActions decider(String candidature, String statut) throws Exception {
        return envoyer(patch("/api/admin/mobilites/candidatures/{id}/decision", candidature), chef, "{\"statut\":\"" + statut + "\"}");
    }

    private static String id(String reponse) {
        return JsonPath.read(reponse, "$.id");
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
