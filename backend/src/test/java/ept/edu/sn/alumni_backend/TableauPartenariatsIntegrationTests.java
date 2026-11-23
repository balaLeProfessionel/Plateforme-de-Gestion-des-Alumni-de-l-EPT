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

/** Tableau de bord des partenariats (Relations extérieures) et résumé d'un organisme. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class TableauPartenariatsIntegrationTests {
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
    void t01_leTableauCompteCeQuiEstEnCoursEtCeQuiAttendUneAction() throws Exception {
        String active = conventionActive(organisme, aujourdhui().plusYears(2));
        conventionActive(organisme, aujourdhui().plusDays(30));
        String resiliee = conventionActive(autreOrganisme, aujourdhui().plusYears(3));
        envoyer(patch("/api/admin/partenariats/conventions/{id}/resilier", resiliee), chef, "{\"motif\":\"Fin\"}").andExpect(status().isOk());
        String demande = JsonPath.read(envoyer(post("/api/partenariats/conventions"), autreOrganisme,
            "{\"objet\":\"Recherche\",\"message\":\"Coopération\"}").andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString(), "$.id");
        String accordStage = proposer(organisme, "STAGE");
        mockMvc.perform(authentifie(patch("/api/admin/partenariats/accords/{id}/accepter", accordStage), chef)).andExpect(status().isOk());
        String proposition = proposer(autreOrganisme, "MOBILITE");

        mockMvc.perform(authentifie(get("/api/admin/partenariats/tableau-de-bord"), chef)).andExpect(status().isOk())
            .andExpect(jsonPath("$.chiffres.partenaires").value(2))
            .andExpect(jsonPath("$.chiffres.conventionsActives").value(3))
            .andExpect(jsonPath("$.chiffres.demandesEnCours").value(1))
            .andExpect(jsonPath("$.chiffres.accordsStageEnVigueur").value(1))
            .andExpect(jsonPath("$.chiffres.accordsMobiliteEnVigueur").value(0))
            .andExpect(jsonPath("$.chiffres.propositionsAExaminer").value(1))
            .andExpect(jsonPath("$.chiffres.expirentBientot").value(1))
            .andExpect(jsonPath("$.chiffres.resiliationsEnCours").value(1))
            .andExpect(jsonPath("$.aTraiter[*].id", hasItem(demande)))
            .andExpect(jsonPath("$.aTraiter[*].id", hasItem(proposition)))
            .andExpect(jsonPath("$.aTraiter[*].motif", hasItem("EXPIRATION")))
            .andExpect(jsonPath("$.aTraiter[*].motif", hasItem("RESILIATION")))
            .andExpect(jsonPath("$.partenairesParType[0].cle").value("ENTREPRISE"))
            .andExpect(jsonPath("$.partenairesParType[0].nombre").value(2))
            .andExpect(jsonPath("$.parAnnee", hasSize(5)))
            .andExpect(jsonPath("$.parAnnee[4].annee").value(aujourdhui().getYear()))
            .andExpect(jsonPath("$.parAnnee[4].conventionsSignees").value(3))
            .andExpect(jsonPath("$.parAnnee[4].accordsStage").value(1))
            .andExpect(jsonPath("$.parAnnee[0].conventionsSignees").value(0));
        assertThat(active).isNotNull();
    }

    @Test
    void t02_lOrganismeVoitSonResumeEtPasLeTableauDeLEcole() throws Exception {
        conventionActive(organisme, aujourdhui().plusYears(2));
        String accord = proposer(organisme, "MOBILITE");
        mockMvc.perform(authentifie(patch("/api/admin/partenariats/accords/{id}/accepter", accord), chef)).andExpect(status().isOk());
        envoyer(post("/api/admin/partenariats/accords"), chef, corpsAccord(organisme.getOrganisme().getId(), "STAGE")).andExpect(status().isCreated());

        mockMvc.perform(authentifie(get("/api/partenariats/mon-partenariat"), organisme))
            .andExpect(jsonPath("$.partenaire").value(true))
            .andExpect(jsonPath("$.conventionsActives", hasSize(1)))
            .andExpect(jsonPath("$.accordsMobiliteEnVigueur").value(1))
            .andExpect(jsonPath("$.reponsesAttendues").value(1));
        mockMvc.perform(authentifie(get("/api/partenariats/mon-partenariat"), autreOrganisme))
            .andExpect(jsonPath("$.partenaire").value(false)).andExpect(jsonPath("$.reponsesAttendues").value(0));
        mockMvc.perform(authentifie(get("/api/admin/partenariats/tableau-de-bord"), organisme)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/partenariats/tableau-de-bord"), adminStages)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/partenariats/mon-partenariat"), chef)).andExpect(status().isForbidden());
    }

    // ----- Outils -----

    private String conventionActive(Utilisateur compte, LocalDate fin) throws Exception {
        return JsonPath.read(envoyer(post("/api/admin/partenariats/conventions"), chef, """
            {"organismeId":"%s","objet":"Accord-cadre","statut":"ACTIVE","dateSignature":"%s","dateDebut":"%s","dateFin":"%s"}"""
            .formatted(compte.getOrganisme().getId(), aujourdhui(), aujourdhui(), fin))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String proposer(Utilisateur compte, String type) throws Exception {
        return JsonPath.read(envoyer(post("/api/partenariats/accords"), compte, corpsAccord(null, type))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String corpsAccord(UUID organismeId, String type) {
        return """
            {"organismeId":%s,"type":"%s","objet":"Accord","filiereIds":["%s"],"dateDebut":"%s","dateFin":"%s"}""".formatted(
            organismeId == null ? "null" : "\"" + organismeId + "\"", type, informatique.getId(), aujourdhui(), aujourdhui().plusYears(1));
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
