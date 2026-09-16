package ept.edu.sn.alumni_backend;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import ept.edu.sn.alumni_backend.enums.StatutCompte;
import ept.edu.sn.alumni_backend.enums.TypeRole;
import ept.edu.sn.alumni_backend.security.UtilisateurPrincipal;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;
import ept.edu.sn.alumni_backend.utilisateur.UtilisateurRepository;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "app.storage.photos.dir=target/test-photos")
class GestionProfilIntegrationTests {
    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    private Utilisateur utilisateur;

    @BeforeEach
    void preparer() {
        utilisateurRepository.deleteAll();
        utilisateur = new Utilisateur();
        utilisateur.setEmail("profil@example.com");
        utilisateur.setPassword("hash");
        utilisateur.setNom("Diop");
        utilisateur.setPrenom("Awa");
        utilisateur.setRole(TypeRole.ALUMNI);
        utilisateur.setStatutCompte(StatutCompte.ACTIF);
        utilisateur.setEmailVerifie(true);
        utilisateur = utilisateurRepository.save(utilisateur);
    }

    @Test
    void modifieEtNormaliseLIdentiteSansExposerLaPhotoDansLaRequete() throws Exception {
        mockMvc.perform(patch("/api/profil/me")
                .with(authentication(authentification()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"nom":"  Ndiaye  ","prenom":"  Aminata  ","bio":"  Ingénieure  "}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.nom").value("Ndiaye"))
            .andExpect(jsonPath("$.prenom").value("Aminata"))
            .andExpect(jsonPath("$.bio").value("Ingénieure"));
    }

    @Test
    void refuseUneIdentiteVide() throws Exception {
        mockMvc.perform(patch("/api/profil/me")
                .with(authentication(authentification()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nom\":\"   \",\"prenom\":\"Awa\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.nom").value("Le nom ne peut pas être vide"));
    }

    @Test
    void ajoutePuisSupprimeUnePhotoValide() throws Exception {
        MockMultipartFile photo = new MockMultipartFile(
            "photo", "portrait.png", "image/png", imagePng()
        );

        mockMvc.perform(multipart("/api/profil/me/photo")
                .file(photo)
                .with(authentication(authentification())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.urlPhoto").value(org.hamcrest.Matchers.matchesPattern(
                "/api/photos/[0-9a-f-]{36}\\.png"
            )));

        mockMvc.perform(delete("/api/profil/me/photo").with(authentication(authentification())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.urlPhoto").doesNotExist());
    }

    @Test
    void refuseUnFauxFichierImage() throws Exception {
        MockMultipartFile photo = new MockMultipartFile(
            "photo", "portrait.png", "image/png", "contenu invalide".getBytes()
        );

        mockMvc.perform(multipart("/api/profil/me/photo")
                .file(photo)
                .with(authentication(authentification())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Le contenu du fichier ne correspond pas à son format."));
    }

    private UsernamePasswordAuthenticationToken authentification() {
        UtilisateurPrincipal principal = new UtilisateurPrincipal(utilisateur);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private byte[] imagePng() throws Exception {
        BufferedImage image = new BufferedImage(40, 40, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, 40, 40);
        graphics.dispose();
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(image, "png", sortie);
        return sortie.toByteArray();
    }
}
