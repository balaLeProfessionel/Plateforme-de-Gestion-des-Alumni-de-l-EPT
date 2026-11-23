package ept.edu.sn.alumni_backend;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

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
import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.organisme.entity.Organisme;
import ept.edu.sn.alumni_backend.organisme.repository.OrganismeRepository;
import ept.edu.sn.alumni_backend.security.JwtService;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.stage.repository.OffreStageRepository;
import ept.edu.sn.alumni_backend.stage.repository.PieceJointeOffreRepository;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

/** Image et pièces jointes PDF des offres de stage. */
@SpringBootTest(properties = "app.storage.photos.dir=target/test-photos")
@AutoConfigureMockMvc
class FichiersOffreIntegrationTests {
    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UtilisateurRepository utilisateurRepository;
    @Autowired private OrganismeRepository organismeRepository;
    @Autowired private OffreStageRepository offreRepository;
    @Autowired private PieceJointeOffreRepository pieceRepository;

    private final List<UUID> organismesCrees = new ArrayList<>();
    private Utilisateur organisme;
    private Utilisateur autreOrganisme;
    private Utilisateur adminStages;
    private Utilisateur etudiant;

    @BeforeEach
    void preparer() {
        organisme = creerCompteOrganisme(StatutCompte.ACTIF);
        autreOrganisme = creerCompteOrganisme(StatutCompte.ACTIF);
        adminStages = creerCompte(TypeRole.ADMIN, PermissionAdmin.GERER_STAGES);
        etudiant = creerCompte(TypeRole.ETUDIANT);
    }

    @AfterEach
    void nettoyer() {
        pieceRepository.deleteAll();
        offreRepository.deleteAll();
        utilisateurRepository.findAll().stream()
            .filter(u -> u.getOrganisme() != null && organismesCrees.contains(u.getOrganisme().getId()))
            .forEach(u -> {
                u.setOrganisme(null);
                utilisateurRepository.save(u);
            });
        organismeRepository.deleteAllById(organismesCrees);
    }

    @Test
    void i01_lOrganismeJointUneImageServieSansJetonEtLaRemplace() throws Exception {
        String offre = publier(organisme);
        String premiere = JsonPath.read(mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/image", offre).file(image()), organisme))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.urlImage", startsWith("/api/offre-images/")))
            .andReturn().getResponse().getContentAsString(), "$.urlImage");
        mockMvc.perform(get(premiere)).andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_JPEG));

        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/image", offre).file(image()), adminStages))
            .andExpect(status().isOk());
        // L'ancienne image est effacée une fois la nouvelle enregistrée.
        mockMvc.perform(get(premiere)).andExpect(status().isNotFound());

        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/image", offre).file(image()), autreOrganisme))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/image", offre)
                .file(new MockMultipartFile("image", "faux.png", "image/png", "pas une image".getBytes())), organisme))
            .andExpect(status().isBadRequest());
        mockMvc.perform(authentifie(delete("/api/stages/offres/{id}/image", offre), organisme))
            .andExpect(status().isOk()).andExpect(jsonPath("$.urlImage").doesNotExist());
    }

    @Test
    void i02_troisPdfAuPlusSeulementDesPdfEtLeTelechargementGardeLeNom() throws Exception {
        String offre = publier(organisme);
        String reponse = mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre)
                .file(pdf("Fiche de poste.pdf")), organisme))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.piecesJointes", hasSize(1)))
            .andExpect(jsonPath("$.piecesJointes[0].nom").value("Fiche de poste.pdf"))
            .andReturn().getResponse().getContentAsString();
        String piece = JsonPath.read(reponse, "$.piecesJointes[0].id");

        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre)
                .file(new MockMultipartFile("fichier", "cv.pdf", "application/pdf", "<html>".getBytes())), organisme))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le contenu du fichier n’est pas un PDF valide."));
        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre)
                .file(new MockMultipartFile("fichier", "note.docx", "application/msword", "%PDF-".getBytes())), organisme))
            .andExpect(status().isBadRequest());
        for (int i = 2; i <= 3; i++) {
            mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre).file(pdf("annexe" + i + ".pdf")), adminStages))
                .andExpect(status().isOk());
        }
        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre).file(pdf("de trop.pdf")), organisme))
            .andExpect(status().isConflict());

        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece), etudiant))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("attachment")))
            .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("Fiche")));
        mockMvc.perform(get("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece)).andExpect(status().isForbidden());

        mockMvc.perform(authentifie(delete("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece), autreOrganisme))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(delete("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece), organisme))
            .andExpect(status().isOk()).andExpect(jsonPath("$.piecesJointes", hasSize(2)));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece), etudiant))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", offre), etudiant))
            .andExpect(jsonPath("$.piecesJointes", hasSize(2)))
            .andExpect(jsonPath("$.modifiable").value(false));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", offre), organisme)).andExpect(jsonPath("$.modifiable").value(true));
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}", offre), autreOrganisme)).andExpect(jsonPath("$.modifiable").value(false));
    }

    @Test
    void i03_lesPiecesDUneOffreNonVisibleNeSeTelechargentPasEtUneOffreRetireeNeSeModifiePlus() throws Exception {
        Utilisateur enAttente = creerCompteOrganisme(StatutCompte.EN_ATTENTE);
        String offre = publier(enAttente);
        String piece = JsonPath.read(mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre)
                .file(pdf("fiche.pdf")), enAttente)).andReturn().getResponse().getContentAsString(), "$.piecesJointes[0].id");
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece), etudiant))
            .andExpect(status().isNotFound());
        mockMvc.perform(authentifie(get("/api/stages/offres/{id}/pieces-jointes/{piece}", offre, piece), adminStages))
            .andExpect(status().isOk());

        mockMvc.perform(authentifie(patch("/api/stages/mes-offres/{id}/retirer", offre), enAttente)).andExpect(status().isOk());
        mockMvc.perform(authentifie(multipart("/api/stages/offres/{id}/pieces-jointes", offre).file(pdf("apres.pdf")), enAttente))
            .andExpect(status().isConflict());
    }

    private String publier(Utilisateur auteur) throws Exception {
        String corps = """
            {"titre":"Offre","description":"Missions","competences":"Rigueur","dureeMois":4,"typeStage":"PFE","dateLimiteCandidature":"%s"}
            """.formatted(LocalDate.now(ZoneId.of("Africa/Dakar")).plusDays(20));
        return JsonPath.read(mockMvc.perform(authentifie(post("/api/stages/mes-offres").contentType(MediaType.APPLICATION_JSON).content(corps), auteur))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    private static MockMultipartFile image() throws Exception {
        BufferedImage image = new BufferedImage(800, 450, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(image, "png", sortie);
        return new MockMultipartFile("image", "illustration.png", "image/png", sortie.toByteArray());
    }

    private static MockMultipartFile pdf(String nom) {
        return new MockMultipartFile("fichier", nom, "application/pdf", "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
    }

    private Utilisateur creerCompteOrganisme(StatutCompte statut) {
        Organisme entite = new Organisme();
        entite.setNom("Organisme " + UUID.randomUUID());
        entite.setStatutValidation(statut);
        entite = organismeRepository.saveAndFlush(entite);
        organismesCrees.add(entite.getId());
        Utilisateur compte = nouveauCompte(TypeRole.ORGANISME);
        compte.setOrganisme(entite);
        return utilisateurRepository.saveAndFlush(compte);
    }

    private Utilisateur creerCompte(TypeRole role, PermissionAdmin... permissions) {
        Utilisateur compte = nouveauCompte(role);
        compte.getPermissionsAdmin().addAll(Set.of(permissions));
        return utilisateurRepository.saveAndFlush(compte);
    }

    private static Utilisateur nouveauCompte(TypeRole role) {
        Utilisateur compte = new Utilisateur();
        compte.setEmail("fichiers." + UUID.randomUUID() + "@example.invalid");
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
