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
import ept.edu.sn.alumni_backend.mobilite.repository.HistoriqueMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.OffreMobiliteRepository;
import ept.edu.sn.alumni_backend.mobilite.repository.PieceJointeOffreMobiliteRepository;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Offres de mobilité : publication, visibilité selon le public, éligibilité, gestion, retrait et documents. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class OffresMobiliteIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private OffreMobiliteRepository offreRepository;
    @Autowired private PieceJointeOffreMobiliteRepository pieceRepository;
    @Autowired private HistoriqueMobiliteRepository historiqueRepository;
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
        pieceRepository.deleteAll();
        offreRepository.deleteAll();
        notificationRepository.deleteAll(notificationRepository.findAll().stream()
            .filter(n -> comptesCrees.contains(n.getDestinataire().getId())).toList());
        utilisateurRepository.deleteAllById(comptesCrees);
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void m01_unEtablissementValidePublieDirectementLesAutresOrganismesNon() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", offre), etudiantInfo))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PUBLIEE"))
            .andExpect(jsonPath("$.candidaturesOuvertes").value(true))
            .andExpect(jsonPath("$.eligibilite.eligible").value(true))
            .andExpect(jsonPath("$.modifiable").value(false));
        assertThat(historiqueRepository.findByObjetIdOrderByDateActionAsc(UUID.fromString(offre)))
            .extracting(h -> h.getAction()).containsExactly(ActionHistorique.PUBLICATION_OFFRE);

        Utilisateur entreprise = creerInstitut(TypeOrganisme.ENTREPRISE, StatutCompte.ACTIF);
        envoyer(post("/api/mobilites/mes-offres"), entreprise, corps("ETUDIANTS", List.of(), List.of())).andExpect(status().isForbidden());
        Utilisateur enAttente = creerInstitut(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT, StatutCompte.EN_ATTENTE);
        envoyer(post("/api/mobilites/mes-offres"), enAttente, corps("ETUDIANTS", List.of(), List.of())).andExpect(status().isForbidden());
        envoyer(post("/api/mobilites/mes-offres"), etudiantInfo, corps("ETUDIANTS", List.of(), List.of())).andExpect(status().isForbidden());
    }

    @Test
    void m02_leChefPublieAuNomDUnPartenaireSansCompte() throws Exception {
        String nom = "Université partenaire " + UUID.randomUUID();
        String saisie = "{\"nomNouvelOrganisme\":\"" + nom + "\",\"offre\":" + corps("TOUS", List.of(), List.of()) + "}";
        String reponse = envoyer(post("/api/admin/mobilites/offres"), chef, saisie)
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.organisme.nom").value(nom))
            .andReturn().getResponse().getContentAsString();
        UUID organisme = UUID.fromString(JsonPath.read(reponse, "$.organisme.id"));
        organismesCrees.add(organisme);
        assertThat(organismeRepository.findById(organisme).orElseThrow().getTypeOrganisme()).isEqualTo(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT);

        envoyer(post("/api/admin/mobilites/offres"), adminStages, saisie).andExpect(status().isForbidden());
    }

    @Test
    void m03_lesReglesEntreLesChampsSontVerifiees() throws Exception {
        String hier = LocalDate.now(ZoneId.of("Africa/Dakar")).minusDays(1).toString();
        envoyer(post("/api/mobilites/mes-offres"), institut, corps("ETUDIANTS", List.of(), List.of()).replace("\"SEMESTRE_1\"", "\"SEJOUR\""))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Indiquez la durée du séjour en semaines."));
        envoyer(post("/api/mobilites/mes-offres"), institut, corps("ENSEIGNANTS", List.of(), List.of()).replace("\"ECHANGE\"", "\"DOUBLE_DIPLOME\""))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Un double diplôme s'adresse aux étudiants."));
        envoyer(post("/api/mobilites/mes-offres"), institut, corps("ETUDIANTS", List.of(), List.of()).replace("2027-2028", "2027-2029"))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/mobilites/mes-offres"), institut, corps("ETUDIANTS", List.of(), List.of()).replace(demain(), hier))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/mobilites/mes-offres"), institut, corps("ENSEIGNANTS", List.of(), List.of("DIC2")))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/mobilites/mes-offres"), institut, corps("ETUDIANTS", List.of(), List.of()).replace("[\"LETTRE_MOTIVATION\"]", "[]"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void m04_chacunNeVoitQueLesOffresDeSonPublic() throws Exception {
        String pourEnseignants = publier(institut, corps("ENSEIGNANTS", List.of(), List.of()).replace("\"ECHANGE\"", "\"ENSEIGNEMENT_RECHERCHE\""));
        String pourEtudiants = publier(institut, corps("ETUDIANTS", List.of(), List.of()));

        mockMvc.perform(authentifie(get("/api/mobilites/offres"), etudiantInfo))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[*].id", hasItem(pourEtudiants)))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(pourEnseignants))));
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", pourEnseignants), etudiantInfo)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mobilites/offres"), enseignant))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(pourEnseignants)))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(pourEtudiants))));
        mockMvc.perform(authentifie(get("/api/mobilites/offres"), alumni)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", pourEtudiants), alumni)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", pourEtudiants), autreInstitut)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", pourEtudiants), chef))
            .andExpect(status().isOk()).andExpect(jsonPath("$.modifiable").value(true));
    }

    @Test
    void m05_lesConditionsDeFiliereEtDeClasseFiltrentLesOffresEligibles() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(informatique.getId().toString()), List.of("DIC2")));

        mockMvc.perform(authentifie(get("/api/mobilites/offres").param("eligibles", "true"), etudiantInfo))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(offre)));
        mockMvc.perform(authentifie(get("/api/mobilites/offres").param("eligibles", "true"), etudiantCivil))
            .andExpect(jsonPath("$.contenu[*].id", not(hasItem(offre))));
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", offre), etudiantCivil))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.eligibilite.eligible").value(false))
            .andExpect(jsonPath("$.eligibilite.raison").value("Cette offre est réservée aux filières " + informatique.getNom() + "."));
    }

    @Test
    void m06_lAnnonceArriveDansLaClocheDesSeulsEtudiantsConcernes() throws Exception {
        publier(institut, corps("ETUDIANTS", List.of(informatique.getId().toString()), List.of()));
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(etudiantInfo.getId())).isEqualTo(1);
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(etudiantCivil.getId())).isZero();
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(enseignant.getId())).isZero();
    }

    @Test
    void m07_lInstitutModifieEtClotureSonOffreUnAutreNon() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String modifie = corps("ETUDIANTS", List.of(), List.of()).replace("\"nombrePlaces\":3", "\"nombrePlaces\":4");
        envoyer(put("/api/mobilites/offres/{id}", offre), autreInstitut, modifie).andExpect(status().isNotFound());
        envoyer(put("/api/mobilites/offres/{id}", offre), etudiantInfo, modifie).andExpect(status().isNotFound());
        envoyer(put("/api/mobilites/offres/{id}", offre), institut, modifie)
            .andExpect(status().isOk()).andExpect(jsonPath("$.nombrePlaces").value(4));
        assertThat(historiqueRepository.findByObjetIdOrderByDateActionAsc(UUID.fromString(offre)))
            .extracting(h -> h.getDetails()).contains("places 3 → 4");

        mockMvc.perform(authentifie(patch("/api/mobilites/offres/{id}/cloturer", offre), institut))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("CLOTUREE"))
            .andExpect(jsonPath("$.candidaturesOuvertes").value(false));
        envoyer(put("/api/mobilites/offres/{id}", offre), institut, modifie).andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/mobilites/mes-offres"), institut))
            .andExpect(jsonPath("$[*].id", hasItem(offre)));
        mockMvc.perform(authentifie(get("/api/mobilites/mes-offres"), etudiantInfo)).andExpect(status().isForbidden());
    }

    @Test
    void m08_leChefRetireUneOffreAvecUnMotif() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        envoyer(patch("/api/admin/mobilites/offres/{id}/retirer", offre), adminStages, "{\"motif\":\"Places non confirmées\"}")
            .andExpect(status().isForbidden());
        envoyer(patch("/api/admin/mobilites/offres/{id}/retirer", offre), chef, "{\"motif\":\"Places non confirmées\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("RETIREE"))
            .andExpect(jsonPath("$.modifiable").value(false));
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", offre), etudiantInfo)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", offre), institut))
            .andExpect(status().isOk()).andExpect(jsonPath("$.motifRetrait").value("Places non confirmées"));
        envoyer(patch("/api/admin/mobilites/offres/{id}/retirer", offre), chef, "{\"motif\":\"Encore\"}").andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/admin/mobilites/offres").param("statut", "RETIREE"), chef))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(offre)));
        // Le contact de l'institut est prévenu dans sa cloche.
        assertThat(notificationRepository.countByDestinataire_IdAndLueFalse(institut.getId())).isEqualTo(1);
    }

    @Test
    void m09_cinqDocumentsAuPlusTelechargeablesParQuiVoitLOffre() throws Exception {
        String offre = publier(institut, corps("ETUDIANTS", List.of(), List.of()));
        String piece = null;
        for (int i = 1; i <= 5; i++) {
            String reponse = mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/pieces-jointes", offre).file(pdf("doc" + i + ".pdf")),
                    i % 2 == 0 ? chef : institut))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            if (piece == null) piece = JsonPath.read(reponse, "$.piecesJointes[0].id");
        }
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/pieces-jointes", offre).file(pdf("de trop.pdf")), institut))
            .andExpect(status().isConflict());
        mockMvc.perform(authentifie(multipart("/api/mobilites/offres/{id}/pieces-jointes", offre).file(pdf("intrus.pdf")), autreInstitut))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}/pieces-jointes/{piece}", offre, piece), etudiantInfo))
            .andExpect(status().isOk()).andExpect(content().contentType(MediaType.APPLICATION_PDF));
        mockMvc.perform(authentifie(get("/api/mobilites/offres/{id}", offre), etudiantInfo))
            .andExpect(jsonPath("$.piecesJointes", hasSize(5)));
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
             "dateLimite":"%s","filiereIds":%s,"classes":%s,"piecesDemandees":["LETTRE_MOTIVATION"]}
            """.formatted(publicVise, demain(), json(filieres), json(classes));
    }

    private static String json(List<String> valeurs) {
        return valeurs.stream().map(v -> "\"" + v + "\"").reduce((a, b) -> a + "," + b).map(v -> "[" + v + "]").orElse("[]");
    }

    private org.springframework.test.web.servlet.ResultActions envoyer(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private static MockMultipartFile pdf(String nom) {
        return new MockMultipartFile("fichier", nom, "application/pdf", "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
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
