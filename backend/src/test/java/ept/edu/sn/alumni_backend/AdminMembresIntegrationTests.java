package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Création de comptes, changement de rôle (GAEPT-5) et passage d'étudiant à alumni (GAEPT-33). */
@SpringBootTest
@AutoConfigureMockMvc
class AdminMembresIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired
    private ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository filiereRepository;
    @Autowired private ActionAdminRepository actionAdminRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @MockitoSpyBean private EmailService emailService;

    private Utilisateur admin;
    /** Préfixe unique des noms et adresses créés ici : la base est partagée avec les autres classes. */
    private String lot;

    @BeforeEach
    void preparer() {
        lot = "m" + UUID.randomUUID().toString().substring(0, 8);
        admin = creerUtilisateur(TypeRole.ADMIN, StatutCompte.ACTIF, "Admin", null);
    }

    @AfterEach
    void nettoyer() {
        // Une filière saisie avec « Autre… » note son auteur : détachée pour que les comptes restent supprimables.
        filiereRepository.saveAll(filiereRepository.findAll().stream().peek(filiere -> filiere.setCreeePar(null)).toList());
        actionAdminRepository.deleteAll();
        refreshTokenRepository.deleteAll();
    }

    @Test
    void m01_creeUnCompteAvecUnMotDePasseProvisoireEnvoyeParEmail() throws Exception {
        String email = lot + ".awa@example.invalid";
        String reponse = envoyer(post("/api/admin/comptes"), admin, """
                {"prenom":" Awa ","nom":"Diop","email":"%s","role":"ALUMNI","filiere":"GIT","anneeEntree":2016,"anneeSortie":2019}
                """.formatted(email))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/api/admin/comptes/")))
            .andExpect(jsonPath("$.motDePasseTemporaire").isString())
            .andReturn().getResponse().getContentAsString();
        String motDePasse = JsonPath.read(reponse, "$.motDePasseTemporaire");

        Utilisateur cree = utilisateurRepository.findByEmail(email).orElseThrow();
        assertThat(cree.getPrenom()).isEqualTo("Awa");
        assertThat(cree.getAnneeSortie()).isEqualTo(2019);
        assertThat(cree.isDoitChangerMotDePasse()).isTrue();
        verify(emailService).envoyerIdentifiants(eq(email), eq("Awa"), eq(motDePasse));
        mockMvc.perform(authentifie(get("/api/admin/journal"), admin))
            .andExpect(jsonPath("$.contenu[0].type").value("CREATION_COMPTE"))
            .andExpect(jsonPath("$.contenu[0].details").value("ALUMNI"));
    }

    @Test
    void m02_refuseLesCreationsIncoherentes() throws Exception {
        envoyer(post("/api/admin/comptes"), admin, """
                {"prenom":"Contact","nom":"Sonatel","email":"%s.org@example.invalid","role":"ORGANISME"}
                """.formatted(lot))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Un compte d'organisme se crée depuis la page d'inscription des organismes."));
        envoyer(post("/api/admin/comptes"), admin, """
                {"prenom":"Awa","nom":"Diop","email":"%s.dates@example.invalid","role":"ALUMNI","anneeEntree":2020,"anneeSortie":2018}
                """.formatted(lot))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("L'année de sortie ne peut pas précéder l'année d'entrée."));
        envoyer(post("/api/admin/comptes"), admin, """
                {"prenom":"Awa","nom":"Diop","email":"%s","role":"ETUDIANT"}
                """.formatted(admin.getEmail()))
            .andExpect(status().isConflict());
    }

    @Test
    void m03_importeUnePromotionEtRendCompteDeChaqueLigne() throws Exception {
        envoyer(post("/api/admin/comptes/import"), admin, """
                {"role":"ETUDIANT","lignes":[
                  {"prenom":"Awa","nom":"Diop","email":"%1$s.1@example.invalid","filiere":"Génie Civil","anneeEntree":2026},
                  {"prenom":"Binta","nom":"Sow","email":"pas-une-adresse","filiere":"Génie Civil","anneeEntree":2026},
                  {"prenom":"Coumba","nom":"Fall","email":"%1$s.1@example.invalid","filiere":"Génie Civil","anneeEntree":2026},
                  {"prenom":"Dame","nom":"Ka","email":"%2$s","filiere":"Génie Civil","anneeEntree":2026},
                  {"prenom":"","nom":"Ndiaye","email":"%1$s.5@example.invalid","filiere":"Génie Civil","anneeEntree":2026}
                ]}
                """.formatted(lot, admin.getEmail()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.crees").value(1))
            .andExpect(jsonPath("$.lignes[*].creee").value(contains(true, false, false, false, false)))
            .andExpect(jsonPath("$.lignes[0].motDePasseTemporaire").isString())
            .andExpect(jsonPath("$.lignes[1].message").value("Format d'email invalide"))
            .andExpect(jsonPath("$.lignes[2].message").value("Cette adresse apparaît plusieurs fois dans le fichier."))
            .andExpect(jsonPath("$.lignes[3].message").value("Un compte existe déjà avec cette adresse."))
            .andExpect(jsonPath("$.lignes[4].message").value("Le prénom est obligatoire"));
        assertThat(utilisateurRepository.findByEmail(lot + ".1@example.invalid")).get()
            .extracting(Utilisateur::getRole).isEqualTo(TypeRole.ETUDIANT);
    }

    @Test
    void m03b_lImportRefuseLesComptesDAdministration() throws Exception {
        envoyer(post("/api/admin/comptes/import"), admin, """
                {"role":"ADMIN","lignes":[{"prenom":"Awa","nom":"Diop","email":"%s.admin@example.invalid"}]}
                """.formatted(lot))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Un compte d'administration se crée un par un, pas par import."));
        assertThat(utilisateurRepository.findByEmail(lot + ".admin@example.invalid")).isEmpty();
    }

    @Test
    void m04_changerUnRoleSAppliqueToutDeSuiteEtSeJustifie() throws Exception {
        Utilisateur membre = creerUtilisateur(TypeRole.PERSONNEL, StatutCompte.ACTIF, "Promu", null);
        mockMvc.perform(authentifie(get("/api/admin/journal"), membre)).andExpect(status().isForbidden());

        envoyer(patch("/api/admin/comptes/{id}/role", membre.getId()), admin, "{\"role\":\"ADMIN\",\"motif\":\" \"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.motif").value("Le motif est obligatoire"));
        envoyer(patch("/api/admin/comptes/{id}/role", membre.getId()), admin,
                "{\"role\":\"ADMIN\",\"motif\":\"Rejoint le service des relations alumni\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.role").value("ADMIN"));

        // Le même jeton ouvre aussitôt le tableau de bord ; le journal attend qu'un super administrateur coche cette responsabilité.
        mockMvc.perform(authentifie(get("/api/admin/tableau-de-bord"), membre)).andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/admin/journal"), membre)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/journal"), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[0].type").value("CHANGEMENT_ROLE"))
            .andExpect(jsonPath("$.contenu[0].details").value("PERSONNEL → ADMIN"))
            .andExpect(jsonPath("$.contenu[0].motif").value("Rejoint le service des relations alumni"));
        verify(emailService).envoyerNotification(eq(membre.getEmail()), eq("Votre rôle sur EPT Alumni a changé"),
            argThat(message -> message.contains("relations alumni") && message.contains("le rôle Administration")));
    }

    @Test
    void m05_lesChangementsDeRoleInterdits() throws Exception {
        Utilisateur organisme = creerUtilisateur(TypeRole.ORGANISME, StatutCompte.ACTIF, "Orga", null);
        Utilisateur suspendu = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.SUSPENDU, "Suspendu", null);
        Utilisateur alumni = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Alumni", null);
        String corps = "{\"role\":\"PERSONNEL\",\"motif\":\"Test\"}";

        envoyer(patch("/api/admin/comptes/{id}/role", admin.getId()), admin, corps)
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Vous ne pouvez pas changer votre propre rôle."));
        envoyer(patch("/api/admin/comptes/{id}/role", organisme.getId()), admin, corps)
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(
                "Le rôle Organisme est lié à une fiche d'organisme : il ne se change pas ici."));
        envoyer(patch("/api/admin/comptes/{id}/role", suspendu.getId()), admin, corps)
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Réactivez le compte avant de changer son rôle."));
        envoyer(patch("/api/admin/comptes/{id}/role", alumni.getId()), admin, "{\"role\":\"ALUMNI\",\"motif\":\"Test\"}")
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Ce compte a déjà ce rôle."));
        envoyer(patch("/api/admin/comptes/{id}/role", alumni.getId()), admin, "{\"role\":\"ORGANISME\",\"motif\":\"Test\"}")
            .andExpect(status().isConflict());

        // Le rôle le plus élevé ne va pas à un compte que l'école n'a pas vérifié ; les autres rôles, si.
        Utilisateur enAttente = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Attente", null);
        envoyer(patch("/api/admin/comptes/{id}/role", enAttente.getId()), admin, "{\"role\":\"ADMIN\",\"motif\":\"Test\"}")
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(
                "Validez d'abord l'inscription de ce compte : le rôle Administration ne se donne qu'à un compte vérifié."));
        assertThat(utilisateurRepository.findById(enAttente.getId()).orElseThrow().getRole()).isEqualTo(TypeRole.ALUMNI);
        envoyer(patch("/api/admin/comptes/{id}/role", enAttente.getId()), admin, corps).andExpect(status().isOk());
    }

    @Test
    void m06_marqueDiplomesLesEtudiantsDUnePromotionEtExpliqueLesAutres() throws Exception {
        Utilisateur awa = creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, "Awa", 2023);
        Utilisateur binta = creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.EN_ATTENTE, "Binta", 2023);
        Utilisateur dejaAlumni = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Coumba", 2020);
        Utilisateur tardive = creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, "Dieynaba", 2027);

        envoyer(post("/api/admin/comptes/diplomation"), admin, """
                {"ids":["%s","%s","%s","%s"],"anneeSortie":2026}
                """.formatted(awa.getId(), binta.getId(), dejaAlumni.getId(), tardive.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.diplomes").value(2))
            .andExpect(jsonPath("$.ignores[*].raison").value(contains(
                "Ce compte n'est pas un compte étudiant.", "L'année de sortie précède son année d'entrée (2027).")));

        Utilisateur diplomee = utilisateurRepository.findById(awa.getId()).orElseThrow();
        assertThat(diplomee.getRole()).isEqualTo(TypeRole.ALUMNI);
        assertThat(diplomee.getAnneeSortie()).isEqualTo(2026);
        verify(emailService).envoyerNotification(eq(awa.getEmail()), eq("Félicitations, vous êtes alumni de l'EPT"),
            argThat(message -> message.contains("promotion 2026")));
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}/historique", awa.getId()), admin))
            .andExpect(jsonPath("$[0].type").value("DIPLOMATION"))
            .andExpect(jsonPath("$[0].details").value("Promotion 2026"));
    }

    @Test
    void m07_listeLesPromotionsEtudiantesEtFiltreLesComptesParPromotion() throws Exception {
        creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, "Promo", 2031);
        creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, "Promo", 2031);

        mockMvc.perform(authentifie(get("/api/admin/comptes/promotions"), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.anneeEntree == 2031 && @.filiere == '%s')].nombre".formatted("F" + lot)).value(hasItem(2)));
        mockMvc.perform(authentifie(get("/api/admin/comptes")
                .param("role", "ETUDIANT").param("anneeEntree", "2031").param("filiere", "f" + lot), admin))
            .andExpect(jsonPath("$.totalElements").value(2));

        // Une promotion « année d'entrée inconnue » reste sélectionnable, sans mélanger les autres années.
        creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, "SansAnnee", null);
        mockMvc.perform(authentifie(get("/api/admin/comptes")
                .param("role", "ETUDIANT").param("sansAnneeEntree", "true").param("filiere", "f" + lot), admin))
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.contenu[0].prenom").value("SansAnnee"));
    }

    @Test
    void m08_laClasseSeSaisitALaCreationEtALImportPuisSeModifieAuJournal() throws Exception {
        String email = lot + ".classe@example.invalid";
        String id = JsonPath.read(envoyer(post("/api/admin/comptes"), admin, """
                {"prenom":"Awa","nom":"Diop","email":"%s","role":"ETUDIANT","classe":"DIC1"}
                """.formatted(email)).andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}", id), admin)).andExpect(jsonPath("$.compte.classe").value("DIC1"));

        // L'import accepte « dic 2 » ou « Master 1 », et signale une classe inconnue sur sa ligne.
        envoyer(post("/api/admin/comptes/import"), admin, """
                {"role":"ETUDIANT","lignes":[
                  {"prenom":"Binta","nom":"Sow","email":"%1$s.i1@example.invalid","classe":"dic 2"},
                  {"prenom":"Coumba","nom":"Fall","email":"%1$s.i2@example.invalid","classe":"Master 1"},
                  {"prenom":"Dame","nom":"Ka","email":"%1$s.i3@example.invalid","classe":"CP3"}
                ]}
                """.formatted(lot))
            .andExpect(jsonPath("$.crees").value(2))
            .andExpect(jsonPath("$.lignes[2].message").value(org.hamcrest.Matchers.startsWith("Classe inconnue : « CP3 »")));
        assertThat(utilisateurRepository.findByEmail(lot + ".i1@example.invalid")).get()
            .extracting(Utilisateur::getClasse).isEqualTo(ept.edu.sn.alumni_backend.enums.Classe.DIC2);
        assertThat(utilisateurRepository.findByEmail(lot + ".i2@example.invalid")).get()
            .extracting(Utilisateur::getClasse).isEqualTo(ept.edu.sn.alumni_backend.enums.Classe.MASTER1);

        envoyer(patch("/api/admin/comptes/{id}/classe", id), admin, "{\"classe\":\"DIC2\"}")
            .andExpect(status().isOk()).andExpect(jsonPath("$.classe").value("DIC2"));
        envoyer(patch("/api/admin/comptes/{id}/classe", id), admin, "{\"classe\":\"DIC2\"}").andExpect(status().isConflict());
        envoyer(patch("/api/admin/comptes/{id}/classe", id), admin, "{}").andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}/historique", id), admin))
            .andExpect(jsonPath("$[0].type").value("MODIFICATION_CLASSE"))
            .andExpect(jsonPath("$[0].details").value("DIC1 → DIC2"));

        Utilisateur alumni = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Coumba", 2020);
        envoyer(patch("/api/admin/comptes/{id}/classe", alumni.getId()), admin, "{\"classe\":\"DIC2\"}")
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Seul un compte étudiant a une classe."));

        // Diplômé, l'étudiant n'a plus de classe.
        envoyer(post("/api/admin/comptes/diplomation"), admin, "{\"ids\":[\"%s\"],\"anneeSortie\":2026}".formatted(id))
            .andExpect(jsonPath("$.diplomes").value(1));
        assertThat(utilisateurRepository.findById(UUID.fromString(id))).get().extracting(Utilisateur::getClasse).isNull();
    }

    @Test
    void m09_lePassageAnnuelFaitMonterUneClasseEtLaisseDeCoteCeuxQuiNOntPlusLaClasseDeDepart() throws Exception {
        Utilisateur awa = etudiantEn("Awa", ept.edu.sn.alumni_backend.enums.Classe.DIC1, StatutCompte.ACTIF);
        Utilisateur binta = etudiantEn("Binta", ept.edu.sn.alumni_backend.enums.Classe.DIC1, StatutCompte.ACTIF);
        Utilisateur dejaPassee = etudiantEn("Coumba", ept.edu.sn.alumni_backend.enums.Classe.DIC2, StatutCompte.ACTIF);
        Utilisateur suspendue = etudiantEn("Dieynaba", ept.edu.sn.alumni_backend.enums.Classe.DIC1, StatutCompte.SUSPENDU);
        Utilisateur sansClasse = etudiantEn("Eva", null, StatutCompte.ACTIF);

        mockMvc.perform(authentifie(get("/api/admin/comptes/classes"), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[?(@.classe == 'DIC1' && @.filiere == '%s')].nombre".formatted("F" + lot)).value(hasItem(2)))
            .andExpect(jsonPath("$[?(@.classe == null && @.filiere == '%s')].nombre".formatted("F" + lot)).value(hasItem(1)));
        mockMvc.perform(authentifie(get("/api/admin/comptes").param("role", "ETUDIANT").param("classe", "DIC1")
                .param("filiere", "f" + lot), admin))
            .andExpect(jsonPath("$.totalElements").value(3));
        mockMvc.perform(authentifie(get("/api/admin/comptes").param("role", "ETUDIANT").param("sansClasse", "true")
                .param("filiere", "f" + lot), admin))
            .andExpect(jsonPath("$.totalElements").value(1));

        envoyer(post("/api/admin/comptes/passage-classe"), admin, """
                {"ids":["%s","%s","%s","%s"],"classeDepart":"DIC1","classeArrivee":"DIC2"}
                """.formatted(awa.getId(), binta.getId(), dejaPassee.getId(), suspendue.getId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.passes").value(2))
            .andExpect(jsonPath("$.ignores[*].raison").value(org.hamcrest.Matchers.containsInAnyOrder(
                "Sa classe a changé entre-temps (DIC2).", "Ce compte est suspendu.")));
        assertThat(utilisateurRepository.findById(awa.getId())).get()
            .extracting(Utilisateur::getClasse).isEqualTo(ept.edu.sn.alumni_backend.enums.Classe.DIC2);
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}/historique", binta.getId()), admin))
            .andExpect(jsonPath("$[0].type").value("MODIFICATION_CLASSE"))
            .andExpect(jsonPath("$[0].details").value("DIC1 → DIC2 (passage annuel)"));

        // Rejoué par erreur, le même passage ne fait plus rien.
        envoyer(post("/api/admin/comptes/passage-classe"), admin, """
                {"ids":["%s"],"classeDepart":"DIC1","classeArrivee":"DIC2"}
                """.formatted(awa.getId()))
            .andExpect(jsonPath("$.passes").value(0));
        // Une classe non renseignée se rattrape aussi en masse.
        envoyer(post("/api/admin/comptes/passage-classe"), admin, """
                {"ids":["%s"],"classeArrivee":"TC1"}
                """.formatted(sansClasse.getId()))
            .andExpect(jsonPath("$.passes").value(1));
        envoyer(post("/api/admin/comptes/passage-classe"), admin, """
                {"ids":["%s"],"classeDepart":"TC1","classeArrivee":"TC1"}
                """.formatted(sansClasse.getId()))
            .andExpect(status().isBadRequest());
        envoyer(post("/api/admin/comptes/passage-classe"), creerUtilisateur(TypeRole.ETUDIANT, StatutCompte.ACTIF, "Moi", null), """
                {"ids":["%s"],"classeArrivee":"TC2"}
                """.formatted(sansClasse.getId()))
            .andExpect(status().isForbidden());
    }

    private Utilisateur etudiantEn(String prenom, ept.edu.sn.alumni_backend.enums.Classe classe, StatutCompte statut) {
        Utilisateur etudiant = creerUtilisateur(TypeRole.ETUDIANT, statut, prenom, 2024);
        etudiant.setClasse(classe);
        return utilisateurRepository.saveAndFlush(etudiant);
    }

    private Utilisateur creerUtilisateur(TypeRole role, StatutCompte statut, String prenom, Integer anneeEntree) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail(lot + "." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword("hash-de-test");
        utilisateur.setPrenom(prenom);
        utilisateur.setNom(lot);
        utilisateur.setRole(role);
        if (role == TypeRole.ADMIN) {
            // Super administrateur, comme les administrateurs existants après la migration (TRA-13).
            utilisateur.getPermissionsAdmin().add(PermissionAdmin.GERER_ADMINISTRATEURS);
        }
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(true);
        utilisateur.setAnneeEntree(anneeEntree);
        utilisateur.setFiliere(FilieresDeTest.filiere(filiereRepository, "F" + lot));
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private ResultActions envoyer(MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(utilisateur)));
    }
}
