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

/** Organismes partenaires vus par les membres, et leur visibilité réglée par les Relations extérieures. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class PartenairesIntegrationTests {
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
    private Utilisateur nonPartenaire;
    private Utilisateur chef;
    private Utilisateur adminStages;
    private Utilisateur etudiant;
    private Utilisateur alumni;
    private Filiere informatique;

    @BeforeEach
    void preparer() {
        informatique = FilieresDeTest.filiere(filiereRepository, "Génie informatique et télécommunications");
        organisme = creerOrganisme(StatutCompte.ACTIF);
        autreOrganisme = creerOrganisme(StatutCompte.ACTIF);
        nonPartenaire = creerOrganisme(StatutCompte.ACTIF);
        Organisme entite = organisme.getOrganisme();
        entite.setNom("Zeta Télécom " + UUID.randomUUID());
        entite.setSecteurActivite("Télécommunications");
        organismeRepository.saveAndFlush(entite);
        Organisme autre = autreOrganisme.getOrganisme();
        autre.setNom("Alpha Université " + UUID.randomUUID());
        autre.setTypeOrganisme(TypeOrganisme.ETABLISSEMENT_ENSEIGNEMENT);
        organismeRepository.saveAndFlush(autre);
        chef = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_PARTENARIATS);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        etudiant = creerCompte(TypeRole.ETUDIANT);
        alumni = creerCompte(TypeRole.ALUMNI);
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
    void p01_lesMembresVoientLesPartenairesAvecLeursAccordsEnVigueur() throws Exception {
        conventionActive(organisme, "Stages, recherche ; mobilité");
        conventionActive(autreOrganisme, null);
        envoyer(post("/api/partenariats/conventions"), nonPartenaire, "{\"objet\":\"Demande\",\"message\":\"Bonjour\"}").andExpect(status().isCreated());
        String accord = JsonPath.read(envoyer(post("/api/partenariats/accords"), organisme, """
            {"type":"STAGE","objet":"Stages","filiereIds":["%s"],"dateDebut":"%s","dateFin":"%s"}"""
            .formatted(informatique.getId(), aujourdhui(), aujourdhui().plusYears(1))).andReturn().getResponse().getContentAsString(), "$.id");
        mockMvc.perform(authentifie(patch("/api/admin/partenariats/accords/{id}/accepter", accord), chef)).andExpect(status().isOk());

        mockMvc.perform(authentifie(get("/api/partenaires"), etudiant)).andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.contenu[0].id").value(autreOrganisme.getOrganisme().getId().toString()))
            .andExpect(jsonPath("$.contenu[1].accordsStage").value(true))
            .andExpect(jsonPath("$.contenu[1].accordsMobilite").value(false))
            .andExpect(jsonPath("$.contenu[1].partenaireDepuis").value(aujourdhui().toString()));
        mockMvc.perform(authentifie(get("/api/partenaires").param("recherche", "zeta"), alumni)).andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(authentifie(get("/api/partenaires").param("type", "ETABLISSEMENT_ENSEIGNEMENT"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(authentifie(get("/api/partenaires").param("secteur", "télécommunications"), etudiant))
            .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(authentifie(get("/api/partenaires/secteurs"), etudiant)).andExpect(jsonPath("$", hasItem("Télécommunications")));

        mockMvc.perform(authentifie(get("/api/partenaires/{id}", organisme.getOrganisme().getId()), etudiant))
            .andExpect(jsonPath("$.domaines", hasSize(3))).andExpect(jsonPath("$.accordsStage").value(true));
        mockMvc.perform(authentifie(get("/api/partenaires/{id}", nonPartenaire.getOrganisme().getId()), etudiant)).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get("/api/partenaires"), organisme)).andExpect(status().isForbidden());
    }

    @Test
    void p02_lesRelationsExterieuresMasquentUnPartenaire() throws Exception {
        String convention = conventionActive(organisme, null);
        String url = "/api/admin/partenariats/organismes/{id}/visibilite";
        UUID id = organisme.getOrganisme().getId();
        envoyer(patch(url, id), adminStages, "{\"visible\":false}").andExpect(status().isForbidden());
        envoyer(patch(url, id), chef, "{}").andExpect(status().isBadRequest());
        envoyer(patch(url, id), chef, "{\"visible\":false}").andExpect(jsonPath("$.visible").value(false));

        mockMvc.perform(authentifie(get("/api/partenaires"), etudiant)).andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(authentifie(get("/api/partenaires/{id}", id), etudiant)).andExpect(status().isNoContent());
        mockMvc.perform(authentifie(get("/api/admin/partenariats/conventions/{id}", convention), chef))
            .andExpect(jsonPath("$.organismeVisible").value(false));
        mockMvc.perform(authentifie(get("/api/admin/partenariats/conventions/{id}/historique", convention), chef))
            .andExpect(jsonPath("$[*].action", hasItem("VISIBILITE")));

        envoyer(patch(url, id), chef, "{\"visible\":true}").andExpect(jsonPath("$.visible").value(true));
        mockMvc.perform(authentifie(get("/api/partenaires"), etudiant)).andExpect(jsonPath("$.totalElements").value(1));
    }

    // ----- Outils -----

    private String conventionActive(Utilisateur compte, String domaines) throws Exception {
        return JsonPath.read(envoyer(post("/api/admin/partenariats/conventions"), chef, """
            {"organismeId":"%s","objet":"Accord-cadre","domaines":%s,"statut":"ACTIVE","dateSignature":"%s","dateDebut":"%s","dateFin":"%s"}"""
            .formatted(compte.getOrganisme().getId(), domaines == null ? "null" : "\"" + domaines + "\"", aujourdhui(), aujourdhui(), aujourdhui().plusYears(2)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
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
