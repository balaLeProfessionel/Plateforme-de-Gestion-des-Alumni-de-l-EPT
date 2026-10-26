package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.repository.ActionAdminRepository;
import ept.edu.sn.alumni_backend.auth.EmailService;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeOrganisme;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.RefreshTokenRepository;
import ept.edu.sn.alumni_backend.security.RefreshTokenService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Validation des inscriptions (GAEPT-3) et suspension des comptes (GAEPT-6) par l'administration. */
@SpringBootTest
@AutoConfigureMockMvc
class AdminComptesIntegrationTests {
    private static final String MOT_DE_PASSE = "MotDePasse-Test-1";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private ActionAdminRepository actionAdminRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private RefreshTokenService refreshTokenService;
    @Autowired private PasswordEncoder passwordEncoder;
    @MockitoSpyBean private EmailService emailService;

    private Utilisateur admin;
    /** Préfixe unique des noms créés ici : la base est partagée avec les autres classes. */
    private String lot;

    @BeforeEach
    void preparer() {
        lot = "Lot" + UUID.randomUUID().toString().substring(0, 8);
        admin = creerUtilisateur(TypeRole.ADMIN, StatutCompte.ACTIF, "Admin");
    }

    /** Les autres classes vident les utilisateurs : on retire ce qui les référence. */
    @AfterEach
    void nettoyer() {
        actionAdminRepository.deleteAll();
        refreshTokenRepository.deleteAll();
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ETUDIANT", "ALUMNI", "PERSONNEL", "ORGANISME", "VISITEUR"})
    void a01_seuleLAdministrationGereLesComptes(TypeRole role) throws Exception {
        Utilisateur membre = creerUtilisateur(role, StatutCompte.ACTIF, "Membre");
        Utilisateur inscrit = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Inscrit");

        mockMvc.perform(authentifie(get("/api/admin/comptes"), membre)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", inscrit.getId()), membre))
            .andExpect(status().isForbidden());
        assertThat(statutDe(inscrit)).isEqualTo(StatutCompte.EN_ATTENTE);
    }

    @Test
    void a02_lesInscriptionsEnAttenteArriventDansLOrdreSansLesEmailsNonVerifies() throws Exception {
        Utilisateur premiere = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Premiere");
        Utilisateur seconde = creerUtilisateur(TypeRole.PERSONNEL, StatutCompte.EN_ATTENTE, "Seconde");
        premiere.setDateCreation(LocalDateTime.now().minusDays(2));
        seconde.setDateCreation(LocalDateTime.now().minusDays(1));
        utilisateurRepository.saveAllAndFlush(java.util.List.of(premiere, seconde));
        Utilisateur nonVerifie = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "NonVerifie");
        nonVerifie.setEmailVerifie(false);
        utilisateurRepository.saveAndFlush(nonVerifie);
        creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Actif");

        mockMvc.perform(authentifie(get("/api/admin/comptes").param("statut", "EN_ATTENTE").param("recherche", lot), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.contenu[*].id").value(contains(premiere.getId().toString(), seconde.getId().toString())))
            .andExpect(jsonPath("$.contenu[0].email").value(premiere.getEmail()))
            .andExpect(jsonPath("$.totalElements").value(2));

        mockMvc.perform(authentifie(get("/api/admin/comptes")
                .param("statut", "EN_ATTENTE").param("role", "PERSONNEL").param("recherche", lot), admin))
            .andExpect(jsonPath("$.contenu[*].id").value(contains(seconde.getId().toString())));
    }

    @Test
    void a03_valideUneInscriptionEtSonOrganismeUneSeuleFois() throws Exception {
        Utilisateur contact = creerUtilisateur(TypeRole.ORGANISME, StatutCompte.EN_ATTENTE, "Contact");
        Organisme organisme = new Organisme();
        organisme.setNom("Organisme " + lot);
        organisme.setTypeOrganisme(TypeOrganisme.ENTREPRISE);
        organisme = organismeRepository.saveAndFlush(organisme);
        contact.setOrganisme(organisme);
        utilisateurRepository.saveAndFlush(contact);

        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", contact.getId()), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutCompte").value("ACTIF"))
            .andExpect(jsonPath("$.nomOrganisme").value("Organisme " + lot));

        assertThat(statutDe(contact)).isEqualTo(StatutCompte.ACTIF);
        assertThat(organismeRepository.findById(organisme.getId()).orElseThrow().getStatutValidation())
            .isEqualTo(StatutCompte.ACTIF);
        verify(emailService).envoyerNotification(eq(contact.getEmail()), eq("Votre inscription est validée"), anyString());

        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", contact.getId()), admin))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Cette inscription a déjà été traitée : impossible de la valider."));

        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}/historique", contact.getId()), admin))
            .andExpect(jsonPath("$[*].type").value(contains("VALIDATION_INSCRIPTION")))
            .andExpect(jsonPath("$[0].auteur").value(admin.getPrenom() + " " + admin.getNom()));
    }

    @Test
    void a04_unRefusExigeUnMotifSuspendLeCompteEtBloqueLaConnexion() throws Exception {
        Utilisateur inscrit = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Refuse");
        refreshTokenService.creerRefreshToken(inscrit);

        envoyer(patch("/api/admin/comptes/{id}/refuser", inscrit.getId()), admin, "{\"motif\":\"  \"}")
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.motif").value("Le motif est obligatoire"));
        assertThat(statutDe(inscrit)).isEqualTo(StatutCompte.EN_ATTENTE);

        envoyer(patch("/api/admin/comptes/{id}/refuser", inscrit.getId()), admin,
                "{\"motif\":\"Diplôme introuvable dans les registres\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutCompte").value("SUSPENDU"))
            .andExpect(jsonPath("$.motifSuspension").value("Diplôme introuvable dans les registres"));

        assertThat(refreshTokenRepository.findAll()).noneMatch(jeton -> jeton.getUtilisateur().getId().equals(inscrit.getId()));
        verify(emailService).envoyerNotification(eq(inscrit.getEmail()), eq("Votre inscription n'a pas été retenue"),
            argThat(message -> message.contains("Diplôme introuvable dans les registres")));
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + inscrit.getEmail() + "\",\"password\":\"" + MOT_DE_PASSE + "\"}"))
            .andExpect(status().isForbidden());

        // Le motif reste lisible dans la liste des comptes suspendus.
        mockMvc.perform(authentifie(get("/api/admin/comptes").param("statut", "SUSPENDU").param("recherche", lot), admin))
            .andExpect(jsonPath("$.contenu[0].motifSuspension").value("Diplôme introuvable dans les registres"));
    }

    @Test
    void a05_uneSuspensionCoupeLAccesToutDeSuite() throws Exception {
        Utilisateur membre = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Suspendu");
        mockMvc.perform(authentifie(get("/api/auth/me"), membre)).andExpect(status().isOk());

        envoyer(patch("/api/admin/comptes/{id}/suspendre", membre.getId()), admin, "{\"motif\":\"Usurpation d'identité\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutCompte").value("SUSPENDU"));

        // Le jeton délivré avant la suspension ne vaut plus rien : 401 explicite pour que le frontend déconnecte.
        mockMvc.perform(authentifie(get("/api/auth/me"), membre))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("COMPTE_SUSPENDU"))
            .andExpect(jsonPath("$.message").value("Votre compte a été suspendu. Contactez l'administration."));
        verify(emailService).envoyerNotification(eq(membre.getEmail()), eq("Votre compte est suspendu"),
            argThat(message -> message.contains("Usurpation d'identité")));

        envoyer(patch("/api/admin/comptes/{id}/suspendre", membre.getId()), admin, "{\"motif\":\"Encore\"}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce compte est déjà suspendu."));
    }

    @Test
    void a06_lesSuspensionsInterdites() throws Exception {
        Utilisateur inscrit = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Attente");

        envoyer(patch("/api/admin/comptes/{id}/suspendre", admin.getId()), admin, "{\"motif\":\"Test\"}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Vous ne pouvez pas suspendre votre propre compte."));
        envoyer(patch("/api/admin/comptes/{id}/suspendre", inscrit.getId()), admin, "{\"motif\":\"Test\"}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(
                "Cette inscription est en attente : refusez-la plutôt que de suspendre le compte."));
        envoyer(patch("/api/admin/comptes/{id}/suspendre", UUID.randomUUID()), admin, "{\"motif\":\"Test\"}")
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Compte introuvable"));
        verify(emailService, never()).envoyerNotification(anyString(), anyString(), anyString());
    }

    @Test
    void a07_reactiverRendLAccesEtLHistoriqueRetraceToutDuPlusRecentAuPlusAncien() throws Exception {
        Utilisateur membre = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Reactive");
        envoyer(patch("/api/admin/comptes/{id}/reactiver", membre.getId()), admin, "{}")
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value("Ce compte n'est pas suspendu."));

        envoyer(patch("/api/admin/comptes/{id}/suspendre", membre.getId()), admin, "{\"motif\":\"Contenus abusifs\"}")
            .andExpect(status().isOk());
        envoyer(patch("/api/admin/comptes/{id}/reactiver", membre.getId()), admin, "{\"motif\":\"Situation régularisée\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutCompte").value("ACTIF"))
            .andExpect(jsonPath("$.motifSuspension").doesNotExist());

        mockMvc.perform(authentifie(get("/api/auth/me"), membre)).andExpect(status().isOk());
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}/historique", membre.getId()), admin))
            .andExpect(jsonPath("$[*].type").value(contains("REACTIVATION", "SUSPENSION")))
            .andExpect(jsonPath("$[*].motif").value(contains("Situation régularisée", "Contenus abusifs")));
    }

    @Test
    void a07b_reactiverUnRefusRemetLInscriptionEnAttenteSansLaValider() throws Exception {
        Utilisateur inscrit = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Reexamen");
        envoyer(patch("/api/admin/comptes/{id}/refuser", inscrit.getId()), admin, "{\"motif\":\"Pièce manquante\"}")
            .andExpect(status().isOk());
        envoyer(patch("/api/admin/comptes/{id}/reactiver", inscrit.getId()), admin, "{\"motif\":\"Pièce reçue\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutCompte").value("EN_ATTENTE"));
        verify(emailService).envoyerNotification(eq(inscrit.getEmail()), eq("Votre inscription est de nouveau examinée"), anyString());
        mockMvc.perform(authentifie(get("/api/auth/me"), inscrit)).andExpect(status().isOk());
    }

    @Test
    void a08_leResumeCompteLesInscriptionsAExaminer() throws Exception {
        String avant = mockMvc.perform(authentifie(get("/api/admin/comptes/resume"), admin))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        int enAttente = JsonPath.read(avant, "$.enAttente");

        Utilisateur inscrit = creerUtilisateur(TypeRole.VISITEUR, StatutCompte.EN_ATTENTE, "Resume");
        mockMvc.perform(authentifie(get("/api/admin/comptes/resume"), admin))
            .andExpect(jsonPath("$.enAttente").value(enAttente + 1));

        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", inscrit.getId()), admin));
        mockMvc.perform(authentifie(get("/api/admin/comptes/resume"), admin))
            .andExpect(jsonPath("$.enAttente").value(enAttente));
        mockMvc.perform(authentifie(get("/api/admin/comptes").param("statut", "EN_ATTENTE").param("recherche", lot), admin))
            .andExpect(jsonPath("$.contenu[*].id").value(not(hasItem(inscrit.getId().toString()))));
    }

    @Test
    void a09_chaqueCompteIndiqueSesDecisionsEtSonOrganisme() throws Exception {
        Utilisateur contact = creerUtilisateur(TypeRole.ORGANISME, StatutCompte.EN_ATTENTE, "Fiche");
        Organisme organisme = new Organisme();
        organisme.setNom("Fiche " + lot);
        organisme = organismeRepository.saveAndFlush(organisme);
        contact.setOrganisme(organisme);
        utilisateurRepository.saveAndFlush(contact);

        mockMvc.perform(authentifie(get("/api/admin/comptes").param("recherche", "Fiche " + lot), admin))
            .andExpect(jsonPath("$.contenu[0].organismeId").value(organisme.getId().toString()))
            .andExpect(jsonPath("$.contenu[0].nombreDecisions").value(0));
        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", contact.getId()), admin))
            .andExpect(jsonPath("$.nombreDecisions").value(1));
        mockMvc.perform(authentifie(get("/api/admin/comptes").param("recherche", "Fiche " + lot), admin))
            .andExpect(jsonPath("$.contenu[0].nombreDecisions").value(1));
    }

    @Test
    void a10_leResumeDetailleLesInscriptionsParType() throws Exception {
        String avant = mockMvc.perform(authentifie(get("/api/admin/comptes/resume"), admin))
            .andReturn().getResponse().getContentAsString();
        java.util.Map<String, Integer> parRole = JsonPath.read(avant, "$.enAttenteParRole");
        int organismes = parRole.getOrDefault("ORGANISME", 0);
        creerUtilisateur(TypeRole.ORGANISME, StatutCompte.EN_ATTENTE, "ParType");

        mockMvc.perform(authentifie(get("/api/admin/comptes/resume"), admin))
            .andExpect(jsonPath("$.enAttenteParRole.ORGANISME").value(organismes + 1));
    }

    @Test
    void a11_unCompteSuspenduQuiSeReinscritSaitQuiContacter() throws Exception {
        Utilisateur suspendu = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.SUSPENDU, "Reinscrit");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"nom":"Diop","prenom":"Awa","email":"%s","password":"MotDePasse-1","role":"ALUMNI"}
                """.formatted(suspendu.getEmail())))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(
                "Un compte suspendu existe déjà avec cet email. Contactez l'administration de l'EPT pour le réactiver."));
    }

    @ParameterizedTest
    @EnumSource(value = TypeRole.class, names = {"ETUDIANT", "ALUMNI", "PERSONNEL", "ORGANISME", "VISITEUR"})
    void a12_leTableauDeBordLeJournalEtLaFicheSontReservesALAdministration(TypeRole role) throws Exception {
        Utilisateur membre = creerUtilisateur(role, StatutCompte.ACTIF, "Curieux");
        mockMvc.perform(authentifie(get("/api/admin/tableau-de-bord"), membre)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/journal"), membre)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}", admin.getId()), membre)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/auth/me"), membre)).andExpect(jsonPath("$.permissions").isEmpty());
    }

    @Test
    void a13_lAdministrationRecoitSesPermissions() throws Exception {
        mockMvc.perform(authentifie(get("/api/auth/me"), admin))
            .andExpect(jsonPath("$.permissions").value(org.hamcrest.Matchers.containsInAnyOrder(
                "CONSULTER_TABLEAU_DE_BORD", "GERER_COMPTES", "CONSULTER_JOURNAL")));
    }

    @Test
    void a14_leTableauDeBordCompteCeQuiAttendEtMontreLesDernieresDecisions() throws Exception {
        Utilisateur ancienne = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Ancienne");
        ancienne.setDateCreation(LocalDateTime.of(2000, 1, 2, 9, 0));
        utilisateurRepository.saveAndFlush(ancienne);
        Utilisateur validee = creerUtilisateur(TypeRole.VISITEUR, StatutCompte.EN_ATTENTE, "Validee");
        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", validee.getId()), admin));

        mockMvc.perform(authentifie(get("/api/admin/tableau-de-bord"), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aTraiter.inscriptionsEnAttente").isNumber())
            .andExpect(jsonPath("$.aTraiter.plusAncienneInscription").value("2000-01-02T09:00:00"))
            .andExpect(jsonPath("$.communaute.comptesActifs").isNumber())
            .andExpect(jsonPath("$.communaute.mentoratsEnCours").isNumber())
            .andExpect(jsonPath("$.dernieresDecisions[0].type").value("VALIDATION_INSCRIPTION"))
            .andExpect(jsonPath("$.dernieresDecisions[0].cibleId").value(validee.getId().toString()))
            .andExpect(jsonPath("$.dernieresDecisions[0].auteur").value(admin.getPrenom() + " " + admin.getNom()));
    }

    @Test
    void a15_leJournalSeFiltreParTypeDuPlusRecentAuPlusAncien() throws Exception {
        Utilisateur membre = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.ACTIF, "Journal");
        envoyer(patch("/api/admin/comptes/{id}/suspendre", membre.getId()), admin, "{\"motif\":\"Spam\"}");
        envoyer(patch("/api/admin/comptes/{id}/reactiver", membre.getId()), admin, "{}");
        Utilisateur inscrit = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Journal");
        mockMvc.perform(authentifie(patch("/api/admin/comptes/{id}/valider", inscrit.getId()), admin));

        mockMvc.perform(authentifie(get("/api/admin/journal"), admin))
            .andExpect(jsonPath("$.contenu[*].type").value(contains("VALIDATION_INSCRIPTION", "REACTIVATION", "SUSPENSION")))
            .andExpect(jsonPath("$.contenu[2].motif").value("Spam"))
            .andExpect(jsonPath("$.contenu[2].cibleNom").value("Journal " + lot));
        mockMvc.perform(authentifie(get("/api/admin/journal").param("type", "SUSPENSION", "REACTIVATION"), admin))
            .andExpect(jsonPath("$.contenu[*].type").value(contains("REACTIVATION", "SUSPENSION")));
    }

    @Test
    void a16_laFicheDonneLesChampsPrivesUtilesALaVerification() throws Exception {
        Utilisateur membre = creerUtilisateur(TypeRole.ALUMNI, StatutCompte.EN_ATTENTE, "Fiche");
        membre.setDateNaissance(java.time.LocalDate.of(1998, 4, 12));
        membre.setVilleResidence("Thiès");
        membre.setPosteActuel("Ingénieure réseau");
        utilisateurRepository.saveAndFlush(membre);

        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}", membre.getId()), admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.compte.id").value(membre.getId().toString()))
            .andExpect(jsonPath("$.compte.statutCompte").value("EN_ATTENTE"))
            .andExpect(jsonPath("$.dateNaissance").value("1998-04-12"))
            .andExpect(jsonPath("$.villeResidence").value("Thiès"))
            .andExpect(jsonPath("$.posteActuel").value("Ingénieure réseau"))
            .andExpect(jsonPath("$.nombreFormations").value(0));
        mockMvc.perform(authentifie(get("/api/admin/comptes/{id}", UUID.randomUUID()), admin))
            .andExpect(status().isNotFound());
    }

    private StatutCompte statutDe(Utilisateur utilisateur) {
        return utilisateurRepository.findById(utilisateur.getId()).orElseThrow().getStatutCompte();
    }

    private Utilisateur creerUtilisateur(TypeRole role, StatutCompte statut, String prenom) {
        Utilisateur utilisateur = new Utilisateur();
        utilisateur.setEmail("admin-comptes." + UUID.randomUUID() + "@example.invalid");
        utilisateur.setPassword(passwordEncoder.encode(MOT_DE_PASSE));
        utilisateur.setPrenom(prenom);
        utilisateur.setNom(lot);
        utilisateur.setRole(role);
        utilisateur.setStatutCompte(statut);
        utilisateur.setEmailVerifie(true);
        return utilisateurRepository.saveAndFlush(utilisateur);
    }

    private org.springframework.test.web.servlet.ResultActions envoyer(
            MockHttpServletRequestBuilder requete, Utilisateur auteur, String corps) throws Exception {
        return mockMvc.perform(authentifie(requete.contentType(MediaType.APPLICATION_JSON).content(corps), auteur));
    }

    private MockHttpServletRequestBuilder authentifie(MockHttpServletRequestBuilder requete, Utilisateur utilisateur) {
        String token = jwtService.genererToken(new UtilisateurPrincipal(utilisateur));
        return requete.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
    }
}
