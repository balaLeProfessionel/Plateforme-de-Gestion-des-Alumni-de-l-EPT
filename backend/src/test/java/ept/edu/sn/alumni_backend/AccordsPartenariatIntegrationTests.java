package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.notification.NotificationRepository;
import ept.edu.sn.alumni_backend.notification.TypeNotification;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.partenariat.StatutAccord;
import ept.edu.sn.alumni_backend.partenariat.entity.AccordCollaboration;
import ept.edu.sn.alumni_backend.filiere.entity.Filiere;
import ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.AccordCollaborationRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.ConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.HistoriqueAccordRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.PieceAccordRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.HistoriqueConventionRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.PieceConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.partenariat.service.AccordsService;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Accords de stage et de mobilité : proposition par l'une des parties, réponse de l'autre, début et fin, documents. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class AccordsPartenariatIntegrationTests {
    private static final String ORGANISME = "/api/partenariats/accords";
    private static final String ADMIN = "/api/admin/partenariats/accords";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private FiliereRepository filiereRepository;
    @Autowired private AccordCollaborationRepository accordRepository;
    @Autowired private PieceAccordRepository pieceAccordRepository;
    @Autowired private HistoriqueAccordRepository historiqueAccordRepository;
    @Autowired private ConventionPartenariatRepository conventionRepository;
    @Autowired private PieceConventionPartenariatRepository pieceRepository;
    @Autowired private HistoriqueConventionRepository historiqueRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private AccordsService accordsService;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private final List<UUID> comptesCrees = new ArrayList<>();
    private Utilisateur organisme;
    private Utilisateur autreOrganisme;
    private Utilisateur chef;
    private Utilisateur adminStages;
    private Filiere informatique;

    @BeforeEach
    void preparer() {
        informatique = FilieresDeTest.filiere(filiereRepository, "Génie informatique et télécommunications");
        organisme = creerOrganisme(StatutCompte.ACTIF);
        autreOrganisme = creerOrganisme(StatutCompte.ACTIF);
        chef = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_PARTENARIATS);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
    }

    @AfterEach
    void nettoyer() {
        historiqueAccordRepository.deleteAll();
        pieceAccordRepository.deleteAll();
        accordRepository.deleteAll();
        historiqueRepository.deleteAll();
        pieceRepository.deleteAll();
        conventionRepository.deleteAll();
        notificationRepository.deleteAll(notificationRepository.findAll().stream()
            .filter(n -> comptesCrees.contains(n.getDestinataire().getId())).toList());
        utilisateurRepository.deleteAllById(comptesCrees);
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void a01_lOrganismeProposeEtLEcoleRepond() throws Exception {
        String id = proposer(organisme, accord(null, null, aujourdhui().minusDays(1), aujourdhui().plusYears(1)));
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(chef.getId()) && n.getLien().endsWith(id));
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}", id), organisme))
            .andExpect(jsonPath("$.modifiable").value(true)).andExpect(jsonPath("$.aRepondre").value(false))
            .andExpect(jsonPath("$.filieres[0].nom").value(informatique.getNom()));
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/accepter", id), organisme)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}", id), autreOrganisme)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(ADMIN), adminStages)).andExpect(status().isForbidden());

        mockMvc.perform(authentifie(get(ADMIN).param("aRepondre", "true"), chef)).andExpect(jsonPath("$.contenu[*].id", hasItem(id)));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", id), chef))
            .andExpect(jsonPath("$.statut").value("ACTIF")).andExpect(jsonPath("$.aRepondre").value(false));
        envoyer(put(ORGANISME + "/{id}", id), organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(1))).andExpect(status().isConflict());
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(organisme.getId()) && n.getTitre().equals("Accord accepté"));
    }

    @Test
    void a02_lEcoleProposeEtLOrganismeRefuseAvecUnMotif() throws Exception {
        String corps = accord(organisme.getOrganisme().getId(), null, aujourdhui().plusMonths(2), aujourdhui().plusYears(2));
        envoyer(post(ADMIN), chef, accord(null, null, aujourdhui(), aujourdhui().plusYears(1))).andExpect(status().isBadRequest());
        String id = proposer(chef, ADMIN, corps);
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}", id), organisme)).andExpect(jsonPath("$.aRepondre").value(true));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", id), chef)).andExpect(status().isConflict());
        envoyer(patch(ORGANISME + "/{id}/refuser", id), organisme, "{\"motif\":\"\"}").andExpect(status().isBadRequest());
        envoyer(patch(ORGANISME + "/{id}/refuser", id), organisme, "{\"motif\":\"Pas de places cette année\"}")
            .andExpect(jsonPath("$.statut").value("REFUSE")).andExpect(jsonPath("$.motifDecision").value("Pas de places cette année"));
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/accepter", id), organisme)).andExpect(status().isConflict());
    }

    @Test
    void a03_unAccordAccepteAvantSonDebutEstAVenirPuisDemarreEtSeTermine() throws Exception {
        String id = proposer(organisme, accord(null, null, aujourdhui().plusDays(10), aujourdhui().plusYears(1)));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", id), chef)).andExpect(jsonPath("$.statut").value("A_VENIR"));
        AccordCollaboration accord = accordRepository.findById(UUID.fromString(id)).orElseThrow();
        accord.setDateDebut(aujourdhui());
        accordRepository.saveAndFlush(accord);
        accordsService.actualiserEcheances();
        assertThat(accordRepository.findById(UUID.fromString(id)).orElseThrow().getStatut()).isEqualTo(StatutAccord.ACTIF);

        accord = accordRepository.findById(UUID.fromString(id)).orElseThrow();
        accord.setDateDebut(aujourdhui().minusYears(1));
        accord.setDateFin(aujourdhui().minusDays(1));
        accordRepository.saveAndFlush(accord);
        accordsService.actualiserEcheances();
        assertThat(accordRepository.findById(UUID.fromString(id)).orElseThrow().getStatut()).isEqualTo(StatutAccord.TERMINE);
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}/historique", id), organisme))
            .andExpect(jsonPath("$[*].action", hasItem("DEBUT"))).andExpect(jsonPath("$[*].action", hasItem("FIN")))
            .andExpect(jsonPath("$[*].auteur", hasItem("Plateforme")));
        for (String titre : List.of("Accord en vigueur", "Accord terminé")) {
            assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(organisme.getId()) && n.getTitre().equals(titre));
            assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(chef.getId()) && n.getTitre().equals(titre));
        }
    }

    @Test
    void a04_leProposantCorrigeOuRetireEtLEcoleResilie() throws Exception {
        String id = proposer(organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(1)));
        envoyer(put(ORGANISME + "/{id}", id), organisme, accord(null, null, aujourdhui().plusDays(1), aujourdhui())).andExpect(status().isBadRequest());
        envoyer(put(ORGANISME + "/{id}", id), organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(2))).andExpect(status().isOk());
        envoyer(put(ADMIN + "/{id}", id), chef, accord(null, null, aujourdhui(), aujourdhui().plusYears(3))).andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/retirer", id), organisme)).andExpect(jsonPath("$.statut").value("RETIRE"));

        String deuxieme = proposer(organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(1)));
        envoyer(patch(ADMIN + "/{id}/resilier", deuxieme), chef, "{\"motif\":\"Trop tôt\"}").andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", deuxieme), chef)).andExpect(status().isOk());
        envoyer(patch(ADMIN + "/{id}/resilier", deuxieme), chef, "{\"motif\":\"Fin du programme\"}")
            .andExpect(jsonPath("$.statut").value("ACTIF")).andExpect(jsonPath("$.resiliationDemandeePar").value("ECOLE"))
            .andExpect(jsonPath("$.dateEffetResiliation").value(aujourdhui().plusMonths(3).toString()))
            .andExpect(jsonPath("$.resiliable").value(false));
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(organisme.getId())
            && n.getTitre().equals("Résiliation d'un accord") && n.getMessage().contains("préavis de 3 mois"));
    }

    @Test
    void a07_lOrganismeResilieAvecUnPreavisDeTroisMois() throws Exception {
        String court = proposer(organisme, accord(null, null, aujourdhui(), aujourdhui().plusMonths(2)));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", court), chef)).andExpect(status().isOk());
        envoyer(patch(ORGANISME + "/{id}/resilier", court), organisme, "{\"motif\":\"Plus de besoin\"}").andExpect(status().isConflict());

        String id = proposer(organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(1)));
        envoyer(patch(ORGANISME + "/{id}/resilier", id), organisme, "{\"motif\":\"Trop tôt\"}").andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", id), chef)).andExpect(jsonPath("$.resiliable").value(true));
        envoyer(patch(ORGANISME + "/{id}/resilier", id), autreOrganisme, "{\"motif\":\"Intrusion\"}").andExpect(status().isNotFound());
        envoyer(patch(ORGANISME + "/{id}/resilier", id), organisme, "{\"motif\":\"Réorganisation interne\"}")
            .andExpect(jsonPath("$.statut").value("ACTIF")).andExpect(jsonPath("$.resiliationDemandeePar").value("ORGANISME"));
        envoyer(patch(ADMIN + "/{id}/resilier", id), chef, "{\"motif\":\"Doublon\"}").andExpect(status().isConflict());
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(chef.getId())
            && n.getTitre().equals("Résiliation d'un accord"));

        AccordCollaboration accord = accordRepository.findById(UUID.fromString(id)).orElseThrow();
        accord.setDateEffetResiliation(aujourdhui());
        accordRepository.saveAndFlush(accord);
        accordsService.actualiserEcheances();
        assertThat(accordRepository.findById(UUID.fromString(id)).orElseThrow().getStatut()).isEqualTo(StatutAccord.RESILIE);
        assertThat(notificationRepository.findAll().stream().filter(n -> n.getTitre().equals("Accord résilié")
            && (n.getDestinataire().getId().equals(chef.getId()) || n.getDestinataire().getId().equals(organisme.getId())))).hasSize(2);
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}/historique", id), organisme))
            .andExpect(jsonPath("$[*].action", hasItem("RESILIATION_EFFECTIVE")));
    }

    @Test
    void a08_laPartieQuiAResilieYRenonceAvantLaDateDEffet() throws Exception {
        String id = proposer(organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(1)));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", id), chef)).andExpect(status().isOk());
        envoyer(patch(ADMIN + "/{id}/resilier", id), chef, "{\"motif\":\"Fin du programme\"}").andExpect(jsonPath("$.resiliationAnnulable").value(true));
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/annuler-resiliation", id), organisme)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/annuler-resiliation", id), chef))
            .andExpect(jsonPath("$.statut").value("ACTIF")).andExpect(jsonPath("$.dateEffetResiliation").doesNotExist())
            .andExpect(jsonPath("$.motifDecision").doesNotExist());
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(organisme.getId())
            && n.getTitre().equals("Résiliation annulée"));
        accordsService.actualiserEcheances();
        assertThat(accordRepository.findById(UUID.fromString(id)).orElseThrow().getStatut()).isEqualTo(StatutAccord.ACTIF);
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}/historique", id), organisme))
            .andExpect(jsonPath("$[*].action", hasItem("ANNULATION_RESILIATION")));
    }

    @Test
    void a05_laConventionCadreEstFacultativeMaisDoitEtreActiveEtALOrganisme() throws Exception {
        String convention = conventionActive(organisme);
        String autre = conventionActive(autreOrganisme);
        envoyer(post(ORGANISME), organisme, accord(null, autre, aujourdhui(), aujourdhui().plusYears(1))).andExpect(status().isBadRequest());
        String id = proposer(organisme, accord(null, convention, aujourdhui(), aujourdhui().plusYears(1)));
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}", id), organisme)).andExpect(jsonPath("$.conventionId").value(convention));
        mockMvc.perform(authentifie(get(ORGANISME), organisme)).andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void a06_lesDocumentsSuiventLesDroitsDeChacun() throws Exception {
        String id = proposer(organisme, accord(null, null, aujourdhui(), aujourdhui().plusYears(1)));
        String piece = JsonPath.read(mockMvc.perform(authentifie(multipart(ORGANISME + "/{id}/pieces", id).file(pdf("accord.pdf")), organisme))
            .andExpect(jsonPath("$.pieces", hasSize(1))).andReturn().getResponse().getContentAsString(), "$.pieces[0].id");
        mockMvc.perform(authentifie(get(ORGANISME + "/{id}/pieces/{p}", id, piece), autreOrganisme)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/accepter", id), chef)).andExpect(status().isOk());
        mockMvc.perform(authentifie(multipart(ORGANISME + "/{id}/pieces", id).file(pdf("tardif.pdf")), organisme)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(delete(ORGANISME + "/{id}/pieces/{p}", id, piece), organisme)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(multipart(ADMIN + "/{id}/pieces", id).file(pdf("signe.pdf")), chef)).andExpect(jsonPath("$.pieces", hasSize(2)));
        mockMvc.perform(authentifie(get(ADMIN + "/{id}/pieces/{p}", id, piece), chef)).andExpect(status().isOk());
    }

    // ----- Outils -----

    private String proposer(Utilisateur auteur, String corps) throws Exception {
        return proposer(auteur, ORGANISME, corps);
    }

    private String proposer(Utilisateur auteur, String url, String corps) throws Exception {
        return JsonPath.read(envoyer(post(url), auteur, corps).andExpect(status().isCreated()).andExpect(jsonPath("$.statut").value("PROPOSE"))
            .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String accord(UUID organismeId, String conventionId, LocalDate debut, LocalDate fin) {
        return """
            {"organismeId":%s,"conventionId":%s,"type":"STAGE","objet":"Stages de fin d'études","description":"Accueil de stagiaires",
             "nombrePlaces":5,"filiereIds":["%s"],"dateDebut":"%s","dateFin":"%s"}""".formatted(
            organismeId == null ? "null" : "\"" + organismeId + "\"", conventionId == null ? "null" : "\"" + conventionId + "\"",
            informatique.getId(), debut, fin);
    }

    private String conventionActive(Utilisateur compte) throws Exception {
        String id = JsonPath.read(envoyer(post("/api/admin/partenariats/conventions"), chef, """
            {"organismeId":"%s","objet":"Accord-cadre","statut":"ACTIVE","dateSignature":"%s","dateDebut":"%s","dateFin":"%s"}"""
            .formatted(compte.getOrganisme().getId(), aujourdhui(), aujourdhui(), aujourdhui().plusYears(3)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        return id;
    }

    private static LocalDate aujourdhui() {
        return LocalDate.now(ZoneId.of("Africa/Dakar"));
    }

    private static MockMultipartFile pdf(String nom) {
        return new MockMultipartFile("fichier", nom, "application/pdf", "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private Utilisateur creerOrganisme(StatutCompte statut) {
        Organisme entite = new Organisme();
        entite.setNom("Organisme partenaire " + UUID.randomUUID());
        entite.setTypeOrganisme(TypeOrganisme.ENTREPRISE);
        entite.setStatutValidation(statut);
        entite = organismeRepository.saveAndFlush(entite);
        organismesCrees.add(entite.getId());
        Utilisateur compte = nouveauCompte(TypeRole.ORGANISME);
        compte.setOrganisme(entite);
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
        compte.setEmail("partenariat." + UUID.randomUUID() + "@example.invalid");
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
