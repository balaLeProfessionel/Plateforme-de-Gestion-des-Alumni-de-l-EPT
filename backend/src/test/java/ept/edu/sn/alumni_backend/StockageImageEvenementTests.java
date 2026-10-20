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
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.util.unit.DataSize;

import ept.edu.sn.alumni_backend.evenement.exception.ImageEvenementIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.service.StockageImageEvenement;

class StockageImageEvenementTests {
    @TempDir
    Path repertoire;

    @Test
    void acceptePngEtJpegEtRedimensionneSansChangerLeRatio() throws Exception {
        StockageImageEvenement stockage = stockage();
        String urlPng = stockage.stocker(fichier("affiche.png", "image/png", image("png", 2400, 1200)));
        String urlJpeg = stockage.stocker(fichier("affiche.jpeg", "image/jpeg", image("jpg", 600, 900)));

        BufferedImage png;
        BufferedImage jpeg;
        try (InputStream contenu = stockage.lire(nom(urlPng)).getInputStream()) {
            png = ImageIO.read(contenu);
        }
        try (InputStream contenu = stockage.lire(nom(urlJpeg)).getInputStream()) {
            jpeg = ImageIO.read(contenu);
        }

        assertTrue(urlPng.matches("/api/evenement-images/[0-9a-f-]{36}\\.png"));
        assertTrue(urlJpeg.matches("/api/evenement-images/[0-9a-f-]{36}\\.jpg"));
        assertEquals(1600, png.getWidth());
        assertEquals(800, png.getHeight());
        assertEquals(600, jpeg.getWidth());
        assertEquals(900, jpeg.getHeight());
    }

    @Test
    void refuseLesFauxFormatsLesExtensionsIncoherentesEtLesFichiersTropGrands() throws Exception {
        StockageImageEvenement stockage = stockage();
        assertThrows(IllegalArgumentException.class, () -> stockage.stocker(
            fichier("faux.png", "image/png", "pas une image".getBytes())));
        assertThrows(IllegalArgumentException.class, () -> stockage.stocker(
            fichier("sans-type.png", null, image("png", 10, 10))));
        assertThrows(IllegalArgumentException.class, () -> stockage.stocker(
            fichier("image.svg", "image/png", image("png", 10, 10))));
        assertThrows(IllegalArgumentException.class, () -> new StockageImageEvenement(
            repertoire.toString(), DataSize.ofBytes(1024)).stocker(
            fichier("grosse.png", "image/png", new byte[1025])));
    }

    @Test
    void refuseLesImagesDontLesDimensionsSontExcessives() throws Exception {
        byte[] image = image("png", 5000, 5000);

        assertThrows(IllegalArgumentException.class, () -> stockage().stocker(
            fichier("trop-grande.png", "image/png", image)));
    }

    @Test
    void bloqueLesCheminsEtNeSupprimeQueLesFichiersGeres() throws Exception {
        StockageImageEvenement stockage = stockage();
        String url = stockage.stocker(fichier("affiche.png", "image/png", image("png", 20, 20)));
        Path imageStockee = repertoire.resolve("evenements").resolve(nom(url));

        stockage.supprimerSiGeree("https://exemple.invalid/affiche.png");
        assertTrue(imageStockee.toFile().exists());
        assertThrows(IllegalArgumentException.class, () -> stockage.lire("../secret.png"));
        Resource resource = stockage.lire(nom(url));
        assertTrue(resource.exists());

        stockage.supprimerSiGeree(url);

        assertFalse(imageStockee.toFile().exists());
        assertThrows(ImageEvenementIntrouvableException.class, () -> stockage.lire(nom(url)));
    }

    private StockageImageEvenement stockage() {
        return new StockageImageEvenement(repertoire.toString(), DataSize.ofMegabytes(5));
    }

    private MockMultipartFile fichier(String nom, String type, byte[] contenu) {
        return new MockMultipartFile("image", nom, type, contenu);
    }

    private String nom(String url) {
        return url.substring("/api/evenement-images/".length());
    }

    private byte[] image(String format, int largeur, int hauteur) throws Exception {
        BufferedImage image = new BufferedImage(largeur, hauteur,
            "png".equals(format) ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        graphics.setColor(Color.BLUE);
        graphics.fillRect(0, 0, largeur, hauteur);
        graphics.dispose();
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(image, format, sortie);
        return sortie.toByteArray();
    }
}
