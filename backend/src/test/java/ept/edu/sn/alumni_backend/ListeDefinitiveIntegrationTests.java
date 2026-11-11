package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.admin.PermissionAdmin;
import ept.edu.sn.alumni_backend.admin.evenement.NotificationCompte;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.repository.CandidatureRepository;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.StageRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Liste définitive d'une offre (STA-04) : brouillon, publication, modifications, e-mails, chevauchements. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
@RecordApplicationEvents
class ListeDefinitiveIntegrationTests {
    private static final LocalDate AUJOURDHUI = LocalDate.now(ZoneId.of("Africa/Dakar"));

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private OffreStageRepository offreRepository;
    @Autowired private CandidatureRepository candidatureRepository;
    @Autowired private StageRepository stageRepository;
    @Autowired private ApplicationEvents evenements;
    @Autowired private ept.edu.sn.alumni_backend.filiere.repository.FiliereRepository filiereRepository;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private Utilisateur organisme;
    private Utilisateur adminStages;
    private Utilisateur candidat;
    private Utilisateur autreCandidat;
    private Utilisateur sansCandidature;
    private String offre;
    private LocalDate debut;

    @BeforeEach
    void preparer() throws Exception {
        organisme = creerCompteOrganisme();
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        candidat = creerCompte(TypeRole.ETUDIANT);
        autreCandidat = creerCompte(TypeRole.ETUDIANT);
        sansCandidature = creerCompte(TypeRole.ETUDIANT);
        debut = AUJOURDHUI.plusMonths(2).withDayOfMonth(1);
        offre = publierOffre(organisme, debut);
        postuler(offre, candidat).andExpect(status().isOk());
        postuler(offre, autreCandidat).andExpect(status().isOk());
    }

    @AfterEach
    void nettoyer() {
        stageRepository.deleteAll();
        candidatureRepository.deleteAll();
        offreRepository.deleteAll();
        utilisateurRepository.findAll().stream()
            .filter(u -> u.getOrganisme() != null && organismesCrees.contains(u.getOrganisme().getId()))
            .forEach(u -> {
                u.setOrganisme(null);
                utilisateurRepository.save(u);
            });
        organismeRepository.findAllById(organismesCrees).forEach(o -> {
            o.setContact(null);
            organismeRepository.save(o);
        });
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void l01_leBrouillonEstInvisiblePuisLaPublicationConfirmeEtPrevient() throws Exception {
        // Un candidat que l'organisme n'a pas retenu, et un étudiant qui n'a pas postulé : l'école décide seule.
        avis(candidat, "NON_RETENUE");
        ajouter(offre, candidat, null, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lignes", hasSize(1)))
            .andExpect(jsonPath("$.lignes[0].statut").value("EN_PREPARATION"))
            .andExpect(jsonPath("$.lignes[0].avisOrganisme").value("NON_RETENUE"))
            .andExpect(jsonPath("$.lignes[0].dateDebut").value(debut.toString()))
            .andExpect(jsonPath("$.lignes[0].dateFin").value(debut.plusMonths(4).minusDays(1).toString()));
        ajouter(offre, sansCandidature, null, null)
            .andExpect(jsonPath("$.lignes", hasSize(2)))
            .andExpect(jsonPath("$.lignes[?(@.etudiant.id == '%s')].candidatureId".formatted(sansCandidature.getId())).value(org.hamcrest.Matchers.contains((Object) null)));

        // Brouillon : ni l'organisme ni les étudiants ne voient rien.
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/stagiaires", offre), organisme))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), sansCandidature)).andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/ma-candidature", offre), candidat))
            .andExpect(jsonPath("$.resultat").doesNotExist());
        assertThat(notifications()).isEmpty();

        mockMvc.perform(authentifie(patch("/api/admin/stages/offres/{id}/liste/publier", offre), adminStages))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statutOffre").value("LISTE_PUBLIEE"))
            .andExpect(jsonPath("$.listePublieeLe").isNotEmpty())
            .andExpect(jsonPath("$.lignes[*].statut", org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("CONFIRME"))));

        assertThat(notifications()).extracting(NotificationCompte::destinataire)
            .containsExactlyInAnyOrder(candidat.getEmail(), sansCandidature.getEmail(), organisme.getEmail());
        assertThat(notifications()).filteredOn(n -> n.destinataire().equals(organisme.getEmail())).singleElement()
            .satisfies(n -> assertThat(n.message()).contains(candidat.getNom()).contains(sansCandidature.getNom()));

        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/ma-candidature", offre), candidat))
            .andExpect(jsonPath("$.resultat").value("RETENUE"));
        mockMvc.perform(authentifie(get("/api/stages/mes-candidatures"), autreCandidat))
            .andExpect(jsonPath("$[0].resultat").value("NON_RETENUE"));
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), sansCandidature))
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].sujet").value("Offre"))
            .andExpect(jsonPath("$[0].dateDebut").value(debut.toString()));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/stagiaires", offre), organisme))
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].email").doesNotExist());

        // Liste publiée : candidatures closes, plus de retrait ni d'avis, l'offre reste consultable.
        postuler(offre, sansCandidature).andExpect(status().isConflict());
        mockMvc.perform(authentifie(patch("/api/stages/offres/{id}/candidature/retirer", offre), autreCandidat))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(containsString("liste définitive")));
        avis(autreCandidat, "RETENUE").andExpect(status().isConflict());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", offre), sansCandidature))
            .andExpect(status().isOk()).andExpect(jsonPath("$.candidaturesOuvertes").value(false));
        mockMvc.perform(authentifie(patch("/api/admin/stages/offres/{id}/liste/publier", offre), adminStages))
            .andExpect(status().isConflict());
    }

    @Test
    void l02_apresPublicationUnAjoutEstConfirmeEtUnRetraitAnnuleAvecMotif() throws Exception {
        String ligne = JsonPath.read(ajouter(offre, candidat, null, null).andReturn().getResponse().getContentAsString(), "$.lignes[0].id");
        publierListe(offre);
        evenements.clear();

        ajouter(offre, autreCandidat, null, null)
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lignes[?(@.etudiant.id == '%s')].statut".formatted(autreCandidat.getId())).value(org.hamcrest.Matchers.contains("CONFIRME")));
        assertThat(notifications()).extracting(NotificationCompte::destinataire)
            .containsExactlyInAnyOrder(autreCandidat.getEmail(), organisme.getEmail());
        evenements.clear();

        retirer(ligne, null).andExpect(status().isBadRequest());
        retirer(ligne, "Stage reporté par l'organisme")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lignes[?(@.id == '%s')].statut".formatted(ligne)).value(org.hamcrest.Matchers.contains("ANNULE")))
            .andExpect(jsonPath("$.lignes[?(@.id == '%s')].motif".formatted(ligne)).value(org.hamcrest.Matchers.contains("Stage reporté par l'organisme")));
        assertThat(notifications()).extracting(NotificationCompte::destinataire)
            .containsExactlyInAnyOrder(candidat.getEmail(), organisme.getEmail());
        assertThat(notifications()).allSatisfy(n -> assertThat(n.message()).contains("Stage reporté par l'organisme"));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/ma-candidature", offre), candidat))
            .andExpect(jsonPath("$.resultat").value("NON_RETENUE"));
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), candidat)).andExpect(jsonPath("$", hasSize(0)));
        retirer(ligne, "encore").andExpect(status().isConflict());

        // Rajouté ensuite : la même ligne redevient confirmée.
        ajouter(offre, candidat, null, null)
            .andExpect(jsonPath("$.lignes[?(@.id == '%s')].statut".formatted(ligne)).value(org.hamcrest.Matchers.contains("CONFIRME")));
    }

    @Test
    void l03_unEtudiantNAJamaisDeuxStagesConfirmesQuiSeChevauchent() throws Exception {
        ajouter(offre, sansCandidature, null, null);
        publierListe(offre);

        String autreOffre = publierOffre(creerCompteOrganisme(), debut.plusMonths(2));
        // Le premier stage court sur 4 mois : un début 2 mois plus tard le chevauche.
        ajouter(autreOffre, sansCandidature, null, null).andExpect(status().isOk());
        mockMvc.perform(authentifie(patch("/api/admin/stages/offres/{id}/liste/publier", autreOffre), adminStages))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.message").value(containsString("les dates se chevauchent")));
        mockMvc.perform(authentifie(get("/api/admin/stages/offres/{id}/liste", autreOffre), adminStages))
            .andExpect(jsonPath("$.statutOffre").value("PUBLIEE"));

        // Décalé après la fin du premier stage, il passe.
        String ligne = JsonPath.read(mockMvc.perform(authentifie(get("/api/admin/stages/offres/{id}/liste", autreOffre), adminStages))
            .andReturn().getResponse().getContentAsString(), "$.lignes[0].id");
        dates(ligne, debut.plusMonths(4), debut.plusMonths(7)).andExpect(status().isOk());
        publierListe(autreOffre);
        mockMvc.perform(authentifie(get("/api/stages/mes-stages"), sansCandidature)).andExpect(jsonPath("$", hasSize(2)));

        // Après publication, un ajout ou un changement de dates qui chevauche est refusé aussi.
        dates(ligne, debut.plusMonths(3), debut.plusMonths(7)).andExpect(status().isConflict());
        String troisieme = publierOffre(creerCompteOrganisme(), debut);
        publierListe(troisieme);
        ajouter(troisieme, sansCandidature, null, null).andExpect(status().isConflict());
    }

    @Test
    void l04_brouillonDatesEtDroits() throws Exception {
        String ligne = JsonPath.read(ajouter(offre, candidat, null, null).andReturn().getResponse().getContentAsString(), "$.lignes[0].id");
        ajouter(offre, candidat, null, null).andExpect(status().isConflict());
        ajouter(offre, creerCompte(TypeRole.ALUMNI), null, null).andExpect(status().isBadRequest());
        ajouter(offre, candidat, debut, null).andExpect(status().isConflict());
        dates(ligne, debut.plusMonths(1), debut).andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("La fin du stage ne peut pas précéder son début."));

        // Retirée du brouillon : la ligne disparaît, sans e-mail.
        retirer(ligne, null).andExpect(status().isOk()).andExpect(jsonPath("$.lignes", hasSize(0)));
        assertThat(notifications()).isEmpty();

        // Une offre sans date de début : les dates sont à saisir avant de publier.
        String sansDate = publierOffre(organisme, null);
        ajouter(sansDate, candidat, null, null).andExpect(status().isOk()).andExpect(jsonPath("$.lignes[0].dateDebut").doesNotExist());
        mockMvc.perform(authentifie(patch("/api/admin/stages/offres/{id}/liste/publier", sansDate), adminStages))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(containsString(candidat.getNom())));

        // Réservé à l'administrateur Stages.
        mockMvc.perform(authentifie(get("/api/admin/stages/offres/{id}/liste", offre), organisme)).andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/admin/stages/offres/{id}/liste", offre), creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_COMPTES)))
            .andExpect(status().isForbidden());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/stagiaires", offre), candidat)).andExpect(status().isNotFound());

        // Une offre retirée emporte son brouillon.
        ajouter(offre, autreCandidat, null, null);
        mockMvc.perform(authentifie(patch("/api/admin/stages/offres/{id}/retirer", offre)
            .contentType(MediaType.APPLICATION_JSON).content("{\"motif\":\"Annulée\"}"), adminStages)).andExpect(status().isOk());
        assertThat(stageRepository.findByOffre_IdOrderByCreeLeAsc(UUID.fromString(offre))).isEmpty();
    }

    @Test
    void l05_lAdministrateurRetrouveUnEtudiantActifParSonNom() throws Exception {
        Utilisateur awa = creerCompte(TypeRole.ETUDIANT);
        awa.setPrenom("Awa");
        awa.setNom("Ndiaye" + UUID.randomUUID().toString().substring(0, 6));
        utilisateurRepository.saveAndFlush(awa);
        Utilisateur suspendu = creerCompte(TypeRole.ETUDIANT);
        suspendu.setNom(awa.getNom());
        suspendu.setStatutCompte(StatutCompte.SUSPENDU);
        utilisateurRepository.saveAndFlush(suspendu);

        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants").param("q", "awa " + awa.getNom().toLowerCase()), adminStages))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(awa.getId().toString()))
            .andExpect(jsonPath("$[0].email").doesNotExist());
        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants").param("q", awa.getNom()), adminStages))
            .andExpect(jsonPath("$", hasSize(1)));
        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants").param("q", "a"), adminStages))
            .andExpect(jsonPath("$", hasSize(0)));
        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants"), adminStages)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void l06_laRechercheSeFiltreParClasseEtParFiliereSansNom() throws Exception {
        String nom = "Classe" + UUID.randomUUID().toString().substring(0, 6);
        ept.edu.sn.alumni_backend.filiere.entity.Filiere genie = FilieresDeTest.filiere(filiereRepository, "Génie " + nom);
        ept.edu.sn.alumni_backend.filiere.entity.Filiere autre = FilieresDeTest.filiere(filiereRepository, "Autre " + nom);
        Utilisateur dic2 = etudiantDe(nom, ept.edu.sn.alumni_backend.enums.Classe.DIC2, genie);
        etudiantDe(nom, ept.edu.sn.alumni_backend.enums.Classe.DIC2, autre);
        etudiantDe(nom, ept.edu.sn.alumni_backend.enums.Classe.DIC1, genie);

        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants")
                .param("classe", "DIC2").param("filiere", genie.getId().toString()), adminStages))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(dic2.getId().toString()))
            .andExpect(jsonPath("$[0].classe").value("DIC2"));
        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants").param("q", nom).param("classe", "DIC2"), adminStages))
            .andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants").param("q", nom).param("filiere", genie.getId().toString()), adminStages))
            .andExpect(jsonPath("$", hasSize(2)));
        mockMvc.perform(authentifie(get("/api/admin/stages/etudiants").param("classe", "CP9"), adminStages))
            .andExpect(status().isBadRequest());
    }

    private Utilisateur etudiantDe(String nom, ept.edu.sn.alumni_backend.enums.Classe classe,
            ept.edu.sn.alumni_backend.filiere.entity.Filiere filiere) {
        Utilisateur etudiant = nouveauCompte(TypeRole.ETUDIANT);
        etudiant.setNom(nom);
        etudiant.setClasse(classe);
        etudiant.setFiliere(filiere);
        return utilisateurRepository.saveAndFlush(etudiant);
    }

    private List<NotificationCompte> notifications() {
        return evenements.stream(NotificationCompte.class).toList();
    }

    private ResultActions ajouter(String offreId, Utilisateur etudiant, LocalDate dateDebut, LocalDate dateFin) throws Exception {
        String corps = "{\"etudiantId\":\"%s\"%s%s}".formatted(etudiant.getId(),
            dateDebut == null ? "" : ",\"dateDebut\":\"" + dateDebut + "\"", dateFin == null ? "" : ",\"dateFin\":\"" + dateFin + "\"");
        return mockMvc.perform(authentifie(post("/api/admin/stages/offres/{id}/liste", offreId)
            .contentType(MediaType.APPLICATION_JSON).content(corps), adminStages));
    }

    private ResultActions dates(String ligne, LocalDate dateDebut, LocalDate dateFin) throws Exception {
        return mockMvc.perform(authentifie(patch("/api/admin/stages/liste/{id}/dates", ligne).contentType(MediaType.APPLICATION_JSON)
            .content("{\"dateDebut\":\"%s\",\"dateFin\":\"%s\"}".formatted(dateDebut, dateFin)), adminStages));
    }

    private ResultActions retirer(String ligne, String motif) throws Exception {
        String corps = motif == null ? "{}" : "{\"motif\":\"" + motif + "\"}";
        return mockMvc.perform(authentifie(patch("/api/admin/stages/liste/{id}/retirer", ligne)
            .contentType(MediaType.APPLICATION_JSON).content(corps), adminStages));
    }

    private void publierListe(String offreId) throws Exception {
        mockMvc.perform(authentifie(patch("/api/admin/stages/offres/{id}/liste/publier", offreId), adminStages)).andExpect(status().isOk());
    }

    private ResultActions avis(Utilisateur etudiant, String avis) throws Exception {
        String candidature = candidatureRepository.findByOffre_IdAndEtudiant_Id(UUID.fromString(offre), etudiant.getId()).orElseThrow().getId().toString();
        return mockMvc.perform(authentifie(patch("/api/stages/candidatures/{id}/avis", candidature)
            .contentType(MediaType.APPLICATION_JSON).content("{\"avis\":\"" + avis + "\"}"), organisme));
    }

    private ResultActions postuler(String offreId, Utilisateur etudiant) throws Exception {
        MockMultipartFile cv = new MockMultipartFile("cv", "cv.pdf", "application/pdf", "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
        return mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/candidature", offreId).file(cv), etudiant));
    }

    private String publierOffre(Utilisateur auteur, LocalDate dateDebutPrevue) throws Exception {
        String corps = """
            {"titre":"Offre","description":"Missions","competences":"Rigueur","dureeMois":4,"typeStage":"PFE","dateLimiteCandidature":"%s"%s}
            """.formatted(AUJOURDHUI.plusDays(20), dateDebutPrevue == null ? "" : ",\"dateDebutPrevue\":\"" + dateDebutPrevue + "\"");
        String reponse = mockMvc.perform(authentifie(post("/api/stages/mes-offres").contentType(MediaType.APPLICATION_JSON).content(corps), auteur))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(reponse, "$.id");
    }

    /** Organisme validé dont le compte est le contact : il reçoit les e-mails de l'école. */
    private Utilisateur creerCompteOrganisme() {
        Organisme entite = new Organisme();
        entite.setNom("Organisme " + UUID.randomUUID());
        entite.setStatutValidation(StatutCompte.ACTIF);
        entite = organismeRepository.saveAndFlush(entite);
        organismesCrees.add(entite.getId());
        Utilisateur compte = nouveauCompte(TypeRole.ORGANISME);
        compte.setOrganisme(entite);
        compte = utilisateurRepository.saveAndFlush(compte);
        entite.setContact(compte);
        organismeRepository.saveAndFlush(entite);
        return compte;
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = nouveauCompte(role);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(compte);
    }

    private static Utilisateur nouveauCompte(TypeRole role) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("liste." + UUID.randomUUID() + "@example.invalid");
        compte.setPassword("hash-de-test");
        compte.setPrenom("Test");
        compte.setNom(role.name() + UUID.randomUUID().toString().substring(0, 4));
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
