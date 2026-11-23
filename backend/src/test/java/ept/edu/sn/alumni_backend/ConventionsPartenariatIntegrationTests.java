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
import ept.edu.sn.alumni_backend.partenariat.StatutConvention;
import ept.edu.sn.alumni_backend.partenariat.entity.ConventionPartenariat;
import ept.edu.sn.alumni_backend.partenariat.repository.ConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.HistoriqueConventionRepository;
import ept.edu.sn.alumni_backend.partenariat.repository.PieceConventionPartenariatRepository;
import ept.edu.sn.alumni_backend.partenariat.service.ConventionsPartenariatService;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Conventions-cadres de partenariat : demande de l'organisme, traitement par les Relations extérieures, échéances, documents. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class ConventionsPartenariatIntegrationTests {
    private static final String ORGANISME = "/api/partenariats/conventions";
    private static final String ADMIN = "/api/admin/partenariats/conventions";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private ConventionPartenariatRepository conventionRepository;
    @Autowired private PieceConventionPartenariatRepository pieceRepository;
    @Autowired private HistoriqueConventionRepository historiqueRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private ConventionsPartenariatService conventionsService;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private final List<UUID> comptesCrees = new ArrayList<>();
    private Utilisateur organisme;
    private Utilisateur autreOrganisme;
    private Utilisateur organismeNonValide;
    private Utilisateur chef;
    private Utilisateur adminStages;
    private Utilisateur etudiant;

    @BeforeEach
    void preparer() {
        organisme = creerOrganisme(StatutCompte.ACTIF);
        autreOrganisme = creerOrganisme(StatutCompte.ACTIF);
        organismeNonValide = creerOrganisme(StatutCompte.EN_ATTENTE);
        chef = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_PARTENARIATS);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        etudiant = creerCompte(TypeRole.ETUDIANT);
    }

    @AfterEach
    void nettoyer() {
        historiqueRepository.deleteAll();
        pieceRepository.deleteAll();
        conventionRepository.deleteAll();
        notificationRepository.deleteAll(notificationRepository.findAll().stream()
            .filter(n -> comptesCrees.contains(n.getDestinataire().getId())).toList());
        utilisateurRepository.deleteAllById(comptesCrees);
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void c01_lOrganismeDemandeUneConventionQueLuiSeulVoitEtQuIlModifieAvantExamen() throws Exception {
        String id = demander(organisme);
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(chef.getId())
            && n.getType() == TypeNotification.PARTENARIAT && n.getLien().endsWith(id));

        envoyer(post(ORGANISME), organisme, demande("Autre objet")).andExpect(status().isConflict());
        envoyer(put(ORGANISME + "/{id}", id), organisme, demande("Coopération en recherche"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.objet").value("Coopération en recherche"));
        mockMvc.perform(authentifie(get(ORGANISME), organisme)).andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(authentifie(get(ORGANISME + "/{id}", id), autreOrganisme)).andExpect(status().isNotFound());
        envoyer(put(ORGANISME + "/{id}", id), autreOrganisme, demande("Détournée")).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(ORGANISME), autreOrganisme)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(authentifie(get(ORGANISME), etudiant)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get(ADMIN), adminStages)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get(ADMIN), organisme)).andExpect(status().isForbidden());

        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/examiner", id), chef)).andExpect(status().isOk());
        envoyer(put(ORGANISME + "/{id}", id), organisme, demande("Trop tard")).andExpect(status().isConflict());
    }

    @Test
    void c02_unOrganismeNonValideNePeutPasDemander() throws Exception {
        envoyer(post(ORGANISME), organismeNonValide, demande("Partenariat")).andExpect(status().isForbidden());
        envoyer(post(ORGANISME), organisme, "{\"objet\":\"\",\"message\":\"\"}").andExpect(status().isBadRequest());
    }

    @Test
    void c03_leChefConduitLaDemandeJusquALaSignaturePuisLaResilie() throws Exception {
        String id = demander(organisme);
        activer(id, aujourdhui().minusDays(1), aujourdhui().plusYears(3)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/negocier", id), chef)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/examiner", id), chef)).andExpect(jsonPath("$.statut").value("EN_EXAMEN"));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/negocier", id), chef)).andExpect(jsonPath("$.statut").value("EN_NEGOCIATION"));

        activer(id, aujourdhui().minusDays(1), aujourdhui().minusDays(1)).andExpect(status().isBadRequest());
        activer(id, aujourdhui().plusDays(1), aujourdhui().plusYears(3)).andExpect(status().isBadRequest());
        activer(id, aujourdhui().minusDays(1), aujourdhui().plusYears(3)).andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("ACTIVE")).andExpect(jsonPath("$.expireBientot").value(false));

        // Un organisme partenaire peut demander une nouvelle convention (renouvellement, nouvel objet).
        envoyer(post(ORGANISME), organisme, demande("Avenant")).andExpect(status().isCreated());

        envoyer(patch(ADMIN + "/{id}/resilier", id), chef, "{\"motif\":\"\"}").andExpect(status().isBadRequest());
        envoyer(patch(ADMIN + "/{id}/resilier", id), chef, "{\"motif\":\"Fin de la coopération\"}")
            .andExpect(jsonPath("$.statut").value("RESILIEE")).andExpect(jsonPath("$.motifDecision").value("Fin de la coopération"));
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/examiner", id), chef)).andExpect(status().isConflict());
        envoyer(put(ADMIN + "/{id}", id), chef, modification(null, null)).andExpect(status().isConflict());

        mockMvc.perform(authentifie(get(ORGANISME + "/{id}/historique", id), organisme))
            .andExpect(jsonPath("$[*].action", hasItem("DEMANDE")))
            .andExpect(jsonPath("$[*].action", hasItem("ACTIVATION")))
            .andExpect(jsonPath("$[*].motif", hasItem("Fin de la coopération")));
        assertThat(notificationRepository.findAll()).anyMatch(n -> n.getDestinataire().getId().equals(organisme.getId())
            && n.getTitre().equals("Convention de partenariat résiliée"));
    }

    @Test
    void c04_lOrganismeAnnuleSaDemandePuisEnDeposeUneAutre() throws Exception {
        String id = demander(organisme);
        envoyer(patch(ADMIN + "/{id}/refuser", id), chef, "{\"motif\":\"Dossier incomplet\"}").andExpect(jsonPath("$.statut").value("REFUSEE"));
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/annuler", id), organisme)).andExpect(status().isConflict());

        String deuxieme = demander(organisme);
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/annuler", deuxieme), autreOrganisme)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/annuler", deuxieme), organisme)).andExpect(jsonPath("$.statut").value("ANNULEE"));
        demander(organisme);
        assertThat(conventionRepository.findAll()).hasSize(3);
    }

    @Test
    void c05_leChefSaisitUneConventionSigneeEtCorrigeSesDates() throws Exception {
        String sansDates = """
            {"organismeId":"%s","objet":"Accord-cadre","statut":"ACTIVE"}""".formatted(organisme.getOrganisme().getId());
        envoyer(post(ADMIN), chef, sansDates).andExpect(status().isBadRequest());
        String demandee = """
            {"organismeId":"%s","objet":"Accord-cadre","statut":"DEMANDEE"}""".formatted(organisme.getOrganisme().getId());
        envoyer(post(ADMIN), chef, demandee).andExpect(status().isBadRequest());

        String id = JsonPath.read(envoyer(post(ADMIN), chef, """
            {"organismeId":"%s","objet":"Accord-cadre","domaines":"Stages, recherche","statut":"ACTIVE",
             "dateSignature":"%s","dateDebut":"%s","dateFin":"%s"}""".formatted(organisme.getOrganisme().getId(),
                aujourdhui().minusMonths(6), aujourdhui().minusMonths(6), aujourdhui().plusDays(30)))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.origine").value("ECOLE"))
            .andExpect(jsonPath("$.expireBientot").value(true)).andExpect(jsonPath("$.joursRestants").value(30))
            .andReturn().getResponse().getContentAsString(), "$.id");

        mockMvc.perform(authentifie(get(ORGANISME), organisme)).andExpect(jsonPath("$[0].statut").value("ACTIVE"));
        mockMvc.perform(authentifie(get(ADMIN).param("expireBientot", "true"), chef)).andExpect(jsonPath("$.contenu[*].id", hasItem(id)));
        mockMvc.perform(authentifie(get(ADMIN).param("recherche", organisme.getOrganisme().getNom().substring(0, 12)), chef))
            .andExpect(jsonPath("$.contenu[*].id", hasItem(id)));

        envoyer(put(ADMIN + "/{id}", id), chef, modification(aujourdhui().minusMonths(6), aujourdhui().plusYears(2)))
            .andExpect(jsonPath("$.expireBientot").value(false));
        mockMvc.perform(authentifie(get(ADMIN + "/{id}/historique", id), chef))
            .andExpect(jsonPath("$[*].action", hasItem("MODIFICATION")));
        mockMvc.perform(authentifie(patch(ORGANISME + "/{id}/annuler", id), organisme)).andExpect(status().isConflict());
    }

    @Test
    void c06_lesConventionsEchuesExpirentEtCellesQuiApprochentSontSignalees() throws Exception {
        String echue = conventionActive(aujourdhui().plusYears(1));
        String proche = conventionActiveAutre(aujourdhui().plusDays(10));
        ConventionPartenariat convention = conventionRepository.findById(UUID.fromString(echue)).orElseThrow();
        convention.setDateFin(aujourdhui().minusDays(1));
        conventionRepository.saveAndFlush(convention);

        conventionsService.actualiserEcheances();
        conventionsService.actualiserEcheances();

        assertThat(conventionRepository.findById(UUID.fromString(echue)).orElseThrow().getStatut()).isEqualTo(StatutConvention.EXPIREE);
        assertThat(conventionRepository.findById(UUID.fromString(proche)).orElseThrow().isAlerteExpirationEnvoyee()).isTrue();
        mockMvc.perform(authentifie(get(ADMIN + "/{id}/historique", echue), chef))
            .andExpect(jsonPath("$[*].auteur", hasItem("Plateforme")));
        assertThat(notificationRepository.findAll().stream()
            .filter(n -> n.getDestinataire().getId().equals(autreOrganisme.getId()) && n.getTitre().equals("Convention bientôt expirée"))).hasSize(1);
    }

    @Test
    void c07_lesDocumentsSuiventLesDroitsDeChacun() throws Exception {
        String id = demander(organisme);
        String reponse = mockMvc.perform(authentifie(multipart(ORGANISME + "/{id}/pieces", id).file(pdf("presentation.pdf")), organisme))
            .andExpect(status().isOk()).andExpect(jsonPath("$.pieces", hasSize(1)))
            .andExpect(jsonPath("$.pieces[0].supprimable").value(true)).andReturn().getResponse().getContentAsString();
        String piece = JsonPath.read(reponse, "$.pieces[0].id");
        mockMvc.perform(authentifie(multipart(ORGANISME + "/{id}/pieces", id)
                .file(new MockMultipartFile("fichier", "photo.png", "image/png", new byte[] {1, 2, 3})), organisme))
            .andExpect(status().isBadRequest());

        mockMvc.perform(authentifie(get(ORGANISME + "/{id}/pieces/{p}", id, piece), autreOrganisme)).andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get(ADMIN + "/{id}/pieces/{p}", id, piece), chef)).andExpect(status().isOk());

        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/examiner", id), chef)).andExpect(status().isOk());
        activer(id, aujourdhui(), aujourdhui().plusYears(2)).andExpect(status().isOk());
        mockMvc.perform(authentifie(multipart(ORGANISME + "/{id}/pieces", id).file(pdf("tardif.pdf")), organisme)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(delete(ORGANISME + "/{id}/pieces/{p}", id, piece), organisme)).andExpect(status().isConflict());
        mockMvc.perform(authentifie(multipart(ADMIN + "/{id}/pieces", id).file(pdf("convention-signee.pdf")), chef))
            .andExpect(jsonPath("$.pieces", hasSize(2)));
        mockMvc.perform(authentifie(delete(ADMIN + "/{id}/pieces/{p}", id, piece), chef)).andExpect(jsonPath("$.pieces", hasSize(1)));
        mockMvc.perform(authentifie(get(ADMIN + "/{id}/historique", id), chef))
            .andExpect(jsonPath("$[*].action", hasItem("RETRAIT_PIECE")));
    }

    // ----- Outils -----

    private String demander(Utilisateur auteur) throws Exception {
        return JsonPath.read(envoyer(post(ORGANISME), auteur, demande("Partenariat de formation"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.statut").value("DEMANDEE"))
            .andReturn().getResponse().getContentAsString(), "$.id");
    }

    private String conventionActive(LocalDate fin) throws Exception {
        String id = demander(organisme);
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/examiner", id), chef)).andExpect(status().isOk());
        activer(id, aujourdhui().minusYears(1), fin).andExpect(status().isOk());
        return id;
    }

    private String conventionActiveAutre(LocalDate fin) throws Exception {
        String id = demander(autreOrganisme);
        mockMvc.perform(authentifie(patch(ADMIN + "/{id}/examiner", id), chef)).andExpect(status().isOk());
        activer(id, aujourdhui().minusYears(1), fin).andExpect(status().isOk());
        return id;
    }

    private ResultActions activer(String id, LocalDate debut, LocalDate fin) throws Exception {
        return envoyer(patch(ADMIN + "/{id}/activer", id), chef, """
            {"dateSignature":"%s","dateDebut":"%s","dateFin":"%s"}""".formatted(debut, debut, fin));
    }

    private static String demande(String objet) {
        return """
            {"objet":"%s","domaines":"Stages, mobilité","message":"Nous souhaitons accueillir des étudiants de l'EPT."}""".formatted(objet);
    }

    private static String modification(LocalDate debut, LocalDate fin) {
        if (debut == null) return "{\"objet\":\"Accord-cadre\"}";
        return """
            {"objet":"Accord-cadre","domaines":"Stages","dateSignature":"%s","dateDebut":"%s","dateFin":"%s"}""".formatted(debut, debut, fin);
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
