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

/** Sélection des candidats : décisions après la date limite, liste définitive, désistement, liste d'attente, doublons. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class DecisionsMobiliteIntegrationTests {
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
    void d01_lesDecisionsAttendentLaDateLimiteEtNeDepassentPasLesPlaces() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()).replace("\"nombrePlaces\":3", "\"nombrePlaces\":1"));
        String a = id(deposer(offre, etudiantInfo));
        String b = id(deposer(offre, etudiantCivil));
        decider(a, "RETENUE").andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Les décisions se prennent après la date limite de candidature."));
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());

        decider(a, "RETENUE").andExpect(status().isOk()).andExpect(jsonPath("$.retenues").value(1)).andExpect(jsonPath("$.sansDecision").value(1));
        decider(b, "RETENUE").andExpect(status().isConflict());
        decider(b, "LISTE_ATTENTE").andExpect(status().isOk())
            .andExpect(jsonPath("$.dossiers[?(@.id == '" + b + "')].rangAttente").value(hasItem(1)));
        envoyer(patch("/api/admin/mobilites/candidatures/{id}/decision", a), adminStages, "{\"statut\":\"NON_RETENUE\"}").andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/mobilites/offres/{id}/candidatures", offre), chef))
            .andExpect(jsonPath("$.blocagePublication").doesNotExist());
        // Le candidat ne voit pas la décision avant la publication de la liste, et ne peut pas encore se désister.
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}/ma-candidature", offre), etudiantCivil))
            .andExpect(jsonPath("$.statut").value("SOUMISE")).andExpect(jsonPath("$.rangAttente").doesNotExist());
        mockMvc.perform(authentifie(patch("/api/mobilites/candidatures/{id}/desister", a), etudiantInfo)).andExpect(status().isConflict());
    }

    @Test
    void d02_laListeSePublieQuandChaqueDossierADecisionEtCreeLesMobilites() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String reponseA = deposer(offre, etudiantInfo);
        String a = id(reponseA);
        String b = id(deposer(offre, etudiantCivil));
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());
        decider(a, "RETENUE").andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/offres/{id}/liste/publier", offre), chef))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("1 dossier n'a pas encore de décision."));
        decider(b, "NON_RETENUE").andExpect(status().isOk());
        long avant = notificationRepository.countByDestinataire_IdAndLueFalse(etudiantCivil.getId());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/offres/{id}/liste/publier", offre), chef))
            .andExpect(status().isOk()).andExpect(jsonPath("$.offre.statut").value("LISTE_PUBLIEE"));
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(etudiantCivil.getId())).isEqualTo(avant + 1);
        assertThat(mobiliteRepository.findAll()).singleElement()
            .satisfies(m -> assertThat(m.getStatut()).isEqualTo(StatutMobilite.PREVUE));
        decider(b, "RETENUE").andExpect(status().isConflict());

        mockMvc.perform(authentifie(get("/api/mobilites/mes-offres/{id}/retenus", offre), institut))
            .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].id").value(a));
        mockMvc.perform(authentifie(get("/api/mobilites/mes-offres/{id}/retenus", offre), autreInstitut)).andExpect(status().isNotFound());
        String piece = JsonPath.read(reponseA, "$.pieces[0].id");
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", a, piece), institut)).andExpect(status().isOk());
    }

    @Test
    void d03_unDesistementLibereUnePlaceQueLeChefDonneAuSuivant() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()).replace("\"nombrePlaces\":3", "\"nombrePlaces\":1"));
        String a = id(deposer(offre, etudiantInfo));
        String b = id(deposer(offre, etudiantCivil));
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());
        decider(a, "RETENUE").andExpect(status().isOk());
        decider(b, "LISTE_ATTENTE").andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/offres/{id}/liste/publier", offre), chef)).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/candidatures/{id}/promouvoir", b), chef)).andExpect(status().isConflict());

        mockMvc.perform(authentifie(patch("/api/mobilites/candidatures/{id}/desister", a), etudiantCivil)).andExpect(status().isNotFound());
        long avant = notificationRepository.countByDestinataire_IdAndLueFalse(chef.getId());
        mockMvc.perform(authentifie(patch("/api/mobilites/candidatures/{id}/desister", a), etudiantInfo)).andExpect(status().isNoContent());
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(chef.getId())).isEqualTo(avant + 1);
        assertThat(mobiliteRepository.findByCandidature_Id(UUID.fromString(a)).orElseThrow().getStatut()).isEqualTo(StatutMobilite.ANNULEE);

        mockMvc.perform(authentifie(patch("/api/admin/mobilites/candidatures/{id}/promouvoir", b), chef))
            .andExpect(status().isOk()).andExpect(jsonPath("$.retenues").value(1));
        assertThat(mobiliteRepository.findByCandidature_Id(UUID.fromString(b)).orElseThrow().getStatut()).isEqualTo(StatutMobilite.PREVUE);
        assertThat(historiqueRepository.findAll()).extracting(h -> h.getAction())
            .contains(ActionHistorique.DESISTEMENT, ActionHistorique.PROMOTION_LISTE_ATTENTE, ActionHistorique.PUBLICATION_LISTE);
    }

    @Test
    void d04_leChefEstAvertiDUnCandidatDejaRetenuPourLaMemePeriode() throws Exception {
        String premiere = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String seconde = publier(autreInstitut, corps("ETUDIANTS", List.of(), List.of()));
        String a1 = id(deposer(premiere, etudiant3));
        String a2 = id(deposer(seconde, etudiant3));
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", premiere), institut)).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", seconde), autreInstitut)).andExpect(status().isOk());
        decider(a1, "RETENUE").andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/admin/mobilites/offres/{id}/candidatures", seconde), chef))
            .andExpect(jsonPath("$.dossiers[0].id").value(a2))
            .andExpect(jsonPath("$.dossiers[0].retenuAilleurs").value(org.hamcrest.Matchers.containsString("Semestre d'échange")));
        // L'avertissement ne bloque pas : le chef tranche.
        decider(a2, "RETENUE").andExpect(status().isOk());
    }

    @Test
    void d05_apresLaDateLimiteOuUneDecisionLaDateLimiteNeChangePlus() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String a = id(deposer(offre, etudiantInfo));
        var entite = offreRepository.findById(UUID.fromString(offre)).orElseThrow();
        entite.setDateLimite(LocalDate.now(ZoneId.of("Africa/Dakar")).minusDays(1));
        offreRepository.saveAndFlush(entite);
        decider(a, "RETENUE").andExpect(status().isOk());
        String plusTard = LocalDate.now(ZoneId.of("Africa/Dakar")).plusDays(30).toString();
        envoyer(put("/api/mobilites/offres/{id}", offre), institut, corps("ETUDIANTS", List.of(), List.of()).replace(demain(), plusTard))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("La sélection a commencé : la date limite ne change plus."));
    }

    @Test
    void d06_annulerUneMobiliteSortanteLibereLaPlace() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()).replace("\"nombrePlaces\":3", "\"nombrePlaces\":1"));
        String a = id(deposer(offre, etudiantInfo));
        String b = id(deposer(offre, etudiantCivil));
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());
        decider(a, "RETENUE").andExpect(status().isOk());
        // Avant la publication, l'institut ne lit pas encore le dossier du candidat retenu.
        String piece = JsonPath.read(mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}/ma-candidature", offre), etudiantInfo))
            .andReturn().getResponse().getContentAsString(), "$.pieces[0].id");
        mockMvc.perform(authentifie(get("/api/mobilites/candidatures/{id}/pieces/{piece}", a, piece), institut)).andExpect(status().isNotFound());
        decider(b, "LISTE_ATTENTE").andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/offres/{id}/liste/publier", offre), chef)).andExpect(status().isOk());

        String mobilite = mobiliteRepository.findByCandidature_Id(UUID.fromString(a)).orElseThrow().getId().toString();
        envoyer(patch("/api/admin/mobilites/mobilites/{id}/statut", mobilite), chef, "{\"statut\":\"ANNULEE\",\"motif\":\"Visa refusé\"}")
            .andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}/ma-candidature", offre), etudiantInfo)).andExpect(jsonPath("$.statut").value("ANNULEE"));
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/candidatures/{id}/promouvoir", b), chef))
            .andExpect(status().isOk()).andExpect(jsonPath("$.retenues").value(1));
    }

    @Test
    void d07_unOrganismeExistantSansTypeNEstPasRequalifie() throws Exception {
        Organisme entreprise = new Organisme();
        entreprise.setNom("Entreprise " + UUID.randomUUID());
        entreprise.setStatutValidation(StatutCompte.ACTIF);
        entreprise = organismeRepository.saveAndFlush(entreprise);
        organismesCrees.add(entreprise.getId());
        envoyer(post("/api/admin/mobilites/offres"), chef, "{\"nomNouvelOrganisme\":\"" + entreprise.getNom().toUpperCase()
                + "\",\"offre\":" + corps("ETUDIANTS", List.of(), List.of()) + "}")
            .andExpect(status().isBadRequest());
        assertThat(organismeRepository.findById(entreprise.getId()).orElseThrow().getTypeOrganisme()).isNull();
    }

    @Test
    void d08_laListeDAttenteRestNumeroteeDeUnANSansDoublon() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()).replace("\"nombrePlaces\":3", "\"nombrePlaces\":1"));
        Utilisateur quatrieme = creerEtudiant(civil, Classe.DIC1);
        String r = id(deposer(offre, etudiant3));
        String a = id(deposer(offre, etudiantInfo));
        String b = id(deposer(offre, etudiantCivil));
        String c = id(deposer(offre, quatrieme));
        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut)).andExpect(status().isOk());
        decider(r, "RETENUE").andExpect(status().isOk());
        decider(a, "LISTE_ATTENTE").andExpect(status().isOk());
        decider(b, "LISTE_ATTENTE").andExpect(status().isOk());
        envoyer(patch("/api/admin/mobilites/candidatures/{id}/decision", c), chef, "{\"statut\":\"LISTE_ATTENTE\",\"rang\":1}").andExpect(status().isOk());
        decider(a, "LISTE_ATTENTE").andExpect(status().isOk());
        assertThat(rangs(c, a, b)).containsExactly(1, 2, 3);

        mockMvc.perform(authentifie(patch("/api/admin/mobilites/offres/{id}/liste/publier", offre), chef)).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/mobilites/candidatures/{id}/desister", r), etudiant3)).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(patch("/api/admin/mobilites/candidatures/{id}/promouvoir", c), chef)).andExpect(status().isOk());
        assertThat(rangs(a, b)).containsExactly(1, 2);
    }

    private List<Integer> rangs(String... candidatures) {
        return java.util.Arrays.stream(candidatures)
            .map(c -> candidatureRepository.findById(UUID.fromString(c)).orElseThrow().getRangAttente()).toList();
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
