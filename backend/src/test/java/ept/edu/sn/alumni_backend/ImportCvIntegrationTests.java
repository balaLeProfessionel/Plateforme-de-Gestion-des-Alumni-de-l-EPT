package ept.edu.sn.alumni_backend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import javax.imageio.ImageIO;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;

import ept.edu.sn.alumni_backend.cv.StatutImportCv;
import ept.edu.sn.alumni_backend.cv.TypeSourceCv;
import ept.edu.sn.alumni_backend.cv.entity.ImportCv;
import ept.edu.sn.alumni_backend.cv.extraction.ContenuCv;
import ept.edu.sn.alumni_backend.cv.extraction.ExtracteurCv;
import ept.edu.sn.alumni_backend.cv.extraction.ProfilExtrait;
import ept.edu.sn.alumni_backend.cv.extraction.ResultatExtraction;
import ept.edu.sn.alumni_backend.cv.repository.ImportCvRepository;
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Import de CV : dépôt, analyse en arrière-plan (IA simulée), vérification du résultat, relecture. */
@SpringBootTest
@AutoConfigureMockMvc
class ImportCvIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurs;
    @Autowired private ImportCvRepository imports;

    @MockitoBean private ExtracteurCv extracteur;

    private final List<Utilisateur> crees = new ArrayList<>();
    private Utilisateur alumni;

    @BeforeEach
    void preparer() {
        when(extracteur.disponible()).thenReturn(true);
        when(extracteur.imagesAcceptees()).thenReturn(true);
        when(extracteur.nomFournisseur()).thenReturn("IA de test");
        alumni = membre(TypeRole.ALUMNI);
    }

    @AfterEach
    void nettoyer() {
        for (Utilisateur u : crees) {
            imports.deleteAll(imports.findByUtilisateurIdAndStatutIn(u.getId(), List.of(StatutImportCv.values())));
            utilisateurs.deleteById(u.getId());
        }
    }

    @Test
    void laDisponibiliteDependDuRole() throws Exception {
        mockMvc.perform(get("/api/imports-cv/disponibilite").header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.disponible").value(true))
            .andExpect(jsonPath("$.imagesAcceptees").value(true))
            .andExpect(jsonPath("$.fournisseur").value("IA de test"))
            .andExpect(jsonPath("$.fichiersMax").value(6));

        mockMvc.perform(get("/api/imports-cv/disponibilite").header(HttpHeaders.AUTHORIZATION, jeton(membre(TypeRole.VISITEUR))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.disponible").value(false));
    }

    @Test
    void unVisiteurNePeutPasImporterDeCv() throws Exception {
        mockMvc.perform(depot(membre(TypeRole.VISITEUR), true, image("capture.png")))
            .andExpect(status().isForbidden());
    }

    @Test
    void sansConsentementLeDepotEstRefuse() throws Exception {
        mockMvc.perform(depot(alumni, false, image("capture.png")))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("accord")));
    }

    @Test
    void unFormatInconnuEstRefuseAvantToutAppelALIa() throws Exception {
        MockMultipartFile texte = new MockMultipartFile("fichiers", "cv.txt", "text/plain", "Mon CV".getBytes());
        mockMvc.perform(depot(alumni, true, texte))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Format non reconnu")));
        verify(extracteur, times(0)).extraire(any());
    }

    @Test
    void unDocumentEtDesImagesNeSeMelangentPas() throws Exception {
        mockMvc.perform(depot(alumni, true, pdfTexte(), image("capture.png")))
            .andExpect(status().isBadRequest());
    }

    @Test
    void desCapturesDonnentUnBrouillonVerifieQueLeMembreValide() throws Exception {
        when(extracteur.extraire(any())).thenReturn(resultat(profilBrut()));

        String reponse = mockMvc.perform(depot(alumni, true, image("profil-1.png"), image("profil-2.jpg")))
            .andExpect(status().isAccepted())
            .andExpect(header().exists(HttpHeaders.LOCATION))
            .andExpect(jsonPath("$.statut").value("EN_COURS"))
            .andExpect(jsonPath("$.typeSource").value("IMAGES"))
            .andReturn().getResponse().getContentAsString();
        UUID id = UUID.fromString(JsonPath.read(reponse, "$.id"));
        attendreStatut(id, StatutImportCv.PRET);

        ArgumentCaptor<ContenuCv> envoye = ArgumentCaptor.forClass(ContenuCv.class);
        verify(extracteur).extraire(envoye.capture());
        assertThat(envoye.getValue().type()).isEqualTo(TypeSourceCv.IMAGES);
        assertThat(envoye.getValue().imagesJpeg()).hasSize(2)
            .allSatisfy(jpeg -> assertThat(jpeg[0] & 0xFF).isEqualTo(0xFF)); // réencodées en JPEG

        mockMvc.perform(get("/api/imports-cv/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("PRET"))
            .andExpect(jsonPath("$.profil.identite.prenom").value("Awa"))
            // Pays non conforme à l'ISO : vidé, pas deviné
            .andExpect(jsonPath("$.profil.identite.paysResidence").doesNotExist())
            // Lien sans protocole : complété
            .andExpect(jsonPath("$.profil.identite.lienLinkedin").value("https://linkedin.com/in/awa"))
            // Dates normalisées ; une fin antérieure au début est vidée
            .andExpect(jsonPath("$.profil.experiences[0].dateDebut").value("2021-09"))
            .andExpect(jsonPath("$.profil.experiences[0].typeContrat").value("STAGE"))
            .andExpect(jsonPath("$.profil.experiences[0].estStage").value(true))
            .andExpect(jsonPath("$.profil.formations[0].dateFin").doesNotExist())
            .andExpect(jsonPath("$.profil.formations[0].typeFormation").value("AUTRE"))
            // Expérience sans intitulé écartée
            .andExpect(jsonPath("$.profil.experiences.length()").value(1))
            // Doublons de compétences fusionnés, langue inconnue écartée, niveau inconnu laissé vide
            .andExpect(jsonPath("$.profil.competences.length()").value(2))
            .andExpect(jsonPath("$.profil.langues.length()").value(1))
            .andExpect(jsonPath("$.profil.langues[0].code").value("wo"))
            .andExpect(jsonPath("$.profil.langues[0].niveau").doesNotExist());

        mockMvc.perform(get("/api/imports-cv/courant").header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()));

        mockMvc.perform(patch("/api/imports-cv/{id}/valider", id).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.statut").value("VALIDE"))
            .andExpect(jsonPath("$.profil").doesNotExist());

        ImportCv clos = imports.findById(id).orElseThrow();
        assertThat(clos.getResultat()).as("le brouillon est effacé après validation").isNull();
        assertThat(clos.getJetonsEntree()).isEqualTo(1200);

        mockMvc.perform(get("/api/imports-cv/courant").header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isNoContent());
        mockMvc.perform(patch("/api/imports-cv/{id}/valider", id).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(status().isConflict());
    }

    @Test
    void unPdfAvecDuTexteEnvoieLeTexteEtNonDesImages() throws Exception {
        when(extracteur.extraire(any())).thenReturn(resultat(profilBrut()));

        UUID id = idDepose(mockMvc.perform(depot(alumni, true, pdfTexte())).andExpect(status().isAccepted())
            .andExpect(jsonPath("$.typeSource").value("TEXTE")).andReturn().getResponse().getContentAsString());
        attendreStatut(id, StatutImportCv.PRET);

        ArgumentCaptor<ContenuCv> envoye = ArgumentCaptor.forClass(ContenuCv.class);
        verify(extracteur).extraire(envoye.capture());
        assertThat(envoye.getValue().texte()).contains("Ingenieure logiciel");
    }

    @Test
    void unFichierWordEstLuEnTexte() throws Exception {
        when(extracteur.extraire(any())).thenReturn(resultat(profilBrut()));

        UUID id = idDepose(mockMvc.perform(depot(alumni, true, docx())).andExpect(status().isAccepted())
            .andExpect(jsonPath("$.typeSource").value("TEXTE")).andReturn().getResponse().getContentAsString());
        attendreStatut(id, StatutImportCv.PRET);

        ArgumentCaptor<ContenuCv> envoye = ArgumentCaptor.forClass(ContenuCv.class);
        verify(extracteur).extraire(envoye.capture());
        assertThat(envoye.getValue().texte()).contains("Projet de fin d'études");
    }

    @Test
    void uneIaEnPanneDonneUnEchecApresUneSeuleNouvelleTentative() throws Exception {
        when(extracteur.extraire(any())).thenThrow(new IllegalStateException("panne simulée"));

        UUID id = idDepose(mockMvc.perform(depot(alumni, true, image("capture.png")))
            .andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString());
        attendreStatut(id, StatutImportCv.ECHEC);

        verify(extracteur, times(2)).extraire(any());
        mockMvc.perform(get("/api/imports-cv/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(alumni)))
            .andExpect(jsonPath("$.statut").value("ECHEC"))
            .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("à la main")));
    }

    @Test
    void unSeulImportALaFoisEtPersonneDAutreNeLeVoit() throws Exception {
        CountDownLatch liberer = new CountDownLatch(1);
        when(extracteur.extraire(any())).thenAnswer(invocation -> {
            liberer.await(10, TimeUnit.SECONDS);
            return resultat(profilBrut());
        });

        UUID id = idDepose(mockMvc.perform(depot(alumni, true, image("capture.png")))
            .andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString());
        try {
            mockMvc.perform(depot(alumni, true, image("capture.png")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Une analyse de CV est déjà en cours."));
            mockMvc.perform(get("/api/imports-cv/{id}", id).header(HttpHeaders.AUTHORIZATION, jeton(membre(TypeRole.ALUMNI))))
                .andExpect(status().isNotFound());
        } finally {
            liberer.countDown();
        }
        attendreStatut(id, StatutImportCv.PRET);
    }

    // --- outils ---

    private Utilisateur membre(TypeRole role) {
        Utilisateur u = new Utilisateur();
        u.setEmail("import-cv." + UUID.randomUUID() + "@example.invalid");
        u.setPassword("hash-de-test");
        u.setPrenom("Test");
        u.setNom("Import");
        u.setRole(role);
        u.setStatutCompte(StatutCompte.ACTIF);
        u.setEmailVerifie(true);
        Utilisateur enregistre = utilisateurs.saveAndFlush(u);
        crees.add(enregistre);
        return enregistre;
    }

    private String jeton(Utilisateur u) {
        return "Bearer " + jwtService.genererToken(new UtilisateurPrincipal(u));
    }

    private MockMultipartHttpServletRequestBuilder depot(Utilisateur u, boolean consentement, MockMultipartFile... fichiers) {
        MockMultipartHttpServletRequestBuilder requete = multipart("/api/imports-cv");
        for (MockMultipartFile fichier : fichiers) requete.file(fichier);
        requete.param("consentement", String.valueOf(consentement));
        requete.header(HttpHeaders.AUTHORIZATION, jeton(u));
        return requete;
    }

    private static UUID idDepose(String reponse) {
        return UUID.fromString(JsonPath.read(reponse, "$.id"));
    }

    private void attendreStatut(UUID id, StatutImportCv attendu) throws InterruptedException {
        Instant limite = Instant.now().plus(Duration.ofSeconds(10));
        while (Instant.now().isBefore(limite)) {
            if (imports.findById(id).map(ImportCv::getStatut).orElse(null) == attendu) return;
            Thread.sleep(50);
        }
        assertThat(imports.findById(id).map(ImportCv::getStatut).orElse(null)).isEqualTo(attendu);
    }

    private static MockMultipartFile image(String nom) throws IOException {
        BufferedImage image = new BufferedImage(800, 600, BufferedImage.TYPE_INT_ARGB);
        ByteArrayOutputStream octets = new ByteArrayOutputStream();
        ImageIO.write(image, nom.endsWith(".jpg") ? "jpg" : "png", octets);
        if (nom.endsWith(".jpg")) {
            BufferedImage rgb = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
            octets.reset();
            ImageIO.write(rgb, "jpg", octets);
        }
        return new MockMultipartFile("fichiers", nom, "application/octet-stream", octets.toByteArray());
    }

    private static MockMultipartFile pdfTexte() throws IOException {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream octets = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream flux = new PDPageContentStream(document, page)) {
                flux.beginText();
                flux.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 11);
                flux.newLineAtOffset(50, 700);
                for (int i = 0; i < 8; i++) {
                    flux.showText("Ingenieure logiciel chez une entreprise fictive, conception d'applications web.");
                    flux.newLineAtOffset(0, -15);
                }
                flux.endText();
            }
            document.save(octets);
            return new MockMultipartFile("fichiers", "cv.pdf", "application/pdf", octets.toByteArray());
        }
    }

    private static MockMultipartFile docx() throws IOException {
        try (XWPFDocument document = new XWPFDocument(); ByteArrayOutputStream octets = new ByteArrayOutputStream()) {
            document.createParagraph().createRun().setText("Awa Ndiaye - Ingénieure logiciel");
            document.createParagraph().createRun().setText("Stage : Projet de fin d'études, 2021");
            document.write(octets);
            return new MockMultipartFile("fichiers", "cv.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", octets.toByteArray());
        }
    }

    private static ResultatExtraction resultat(ProfilExtrait profil) {
        return new ResultatExtraction(profil, "test", "modele-test", 1200, 800);
    }

    /** Réponse volontairement imparfaite, comme une IA peut en produire. */
    private static ProfilExtrait profilBrut() {
        return new ProfilExtrait(
            new ProfilExtrait.Identite("Awa", "Ndiaye", "+221 70 000 00 00", "Dakar", "Senegal",
                null, null, "linkedin.com/in/awa", null),
            List.of(new ProfilExtrait.FormationExtraite("Master informatique", "Université fictive", "Master",
                "2019-09", "2017", false, null)),
            List.of(
                new ProfilExtrait.ExperienceExtraite("Stagiaire", "Entreprise fictive", "Stage",
                    "2021-9-15", "2022-02", false, false, null),
                new ProfilExtrait.ExperienceExtraite("  ", "Sans poste", null, null, null, null, null, null)),
            List.of("Java", "java", " Spring-Boot "),
            List.of(new ProfilExtrait.LangueExtraite("WO", "langue maternelle"),
                new ProfilExtrait.LangueExtraite("klingon", "COURANT")));
    }
}
