package ept.edu.sn.alumni_backend;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Path;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoProfil;

class StockagePhotoProfilTests {
    @TempDir
    Path repertoire;

    @Test
    void stockeUneImageSousUnNomOpaqueEtLaRedimensionne() throws Exception {
        StockagePhotoProfil stockage = stockage();
        MockMultipartFile fichier = new MockMultipartFile(
            "photo", "portrait.png", "image/png", imagePng(1200, 600)
        );

        String url = stockage.stocker(fichier);
        BufferedImage enregistree;
        try (InputStream entree = stockage.lire(url.substring("/api/photos/".length())).getInputStream()) {
            enregistree = ImageIO.read(entree);
        }

        assertTrue(url.matches("/api/photos/[0-9a-f-]{36}\\.png"));
        assertEquals(800, enregistree.getWidth());
        assertEquals(400, enregistree.getHeight());
        stockage.supprimerSiGeree(url);
    }

    @Test
    void refuseUnContenuQuiNeCorrespondPasAuTypeAnnonce() {
        MockMultipartFile fichier = new MockMultipartFile(
            "photo", "fausse.png", "image/png", "pas une image".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> stockage().stocker(fichier));
    }

    @Test
    void refuseUnFichierTropGrand() {
        MockMultipartFile fichier = new MockMultipartFile(
            "photo", "grande.jpg", "image/jpeg", new byte[1025]
        );
        StockagePhotoProfil stockage = new StockagePhotoProfil(repertoire.toString(), DataSize.ofBytes(1024));

        assertThrows(IllegalArgumentException.class, () -> stockage.stocker(fichier));
    }

    @Test
    void supprimeSeulementUnePhotoGereeEtBloqueLesCheminsInvalides() throws Exception {
        StockagePhotoProfil stockage = stockage();
        String url = stockage.stocker(new MockMultipartFile(
            "photo", "portrait.png", "image/png", imagePng(20, 20)
        ));
        String nom = url.substring("/api/photos/".length());

        stockage.supprimerSiGeree(url);

        assertFalse(repertoire.resolve(nom).toFile().exists());
        assertThrows(IllegalArgumentException.class, () -> stockage.lire("../secret.png"));
        stockage.supprimerSiGeree("https://images.example/photo.png");
    }

    private StockagePhotoProfil stockage() {
        return new StockagePhotoProfil(repertoire.toString(), DataSize.ofMegabytes(5));
    }

    private byte[] imagePng(int largeur, int hauteur) throws Exception {
        BufferedImage image = new BufferedImage(largeur, hauteur, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, largeur, hauteur);
        graphics.dispose();
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(image, "png", sortie);
        return sortie.toByteArray();
    }
}
