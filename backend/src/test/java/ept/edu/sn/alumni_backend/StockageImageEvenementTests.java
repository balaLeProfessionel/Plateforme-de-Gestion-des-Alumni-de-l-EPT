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
    void imposeLeFormatSeizeNeuviemesEnJpegQuelQueSoitLeRapportEnvoye() throws Exception {
        StockageImageEvenement stockage = stockage();
        String urlPng = stockage.stocker(fichier("affiche.png", "image/png", image("png", 2400, 1200)));
        String urlJpeg = stockage.stocker(fichier("affiche.jpeg", "image/jpeg", image("jpg", 900, 1600)));
        String urlExacte = stockage.stocker(fichier("exacte.jpg", "image/jpeg", image("jpg", 800, 450)));

        for (String url : new String[] {urlPng, urlJpeg, urlExacte}) {
            assertTrue(url.matches("/api/evenement-images/[0-9a-f-]{36}\\.jpg"), url);
            BufferedImage stockee = lireImage(stockage, url);
            assertEquals(1600, stockee.getWidth());
            assertEquals(900, stockee.getHeight());
        }
    }

    @Test
    void recadreAuCentreEtDonneUnFondBlancAuxZonesTransparentes() throws Exception {
        StockageImageEvenement stockage = stockage();
        // Bande rouge à gauche, bleu au centre, bande verte à droite : seules les bandes sont coupées.
        BufferedImage source = new BufferedImage(2400, 900, BufferedImage.TYPE_INT_ARGB);
        var graphics = source.createGraphics();
        graphics.setColor(Color.RED);
        graphics.fillRect(0, 0, 400, 900);
        graphics.setColor(Color.BLUE);
        graphics.fillRect(400, 0, 1600, 900);
        graphics.setColor(Color.GREEN);
        graphics.fillRect(2000, 0, 400, 900);
        graphics.dispose();
        BufferedImage centre = lireImage(stockage, stockage.stocker(fichier("bandes.png", "image/png", encoder(source, "png"))));
        assertBleu(centre.getRGB(5, 450));
        assertBleu(centre.getRGB(1594, 450));

        BufferedImage transparente = new BufferedImage(1600, 900, BufferedImage.TYPE_INT_ARGB);
        BufferedImage blanche = lireImage(stockage, stockage.stocker(
            fichier("transparente.png", "image/png", encoder(transparente, "png"))));
        Color pixel = new Color(blanche.getRGB(800, 450));
        assertTrue(pixel.getRed() > 240 && pixel.getGreen() > 240 && pixel.getBlue() > 240, pixel.toString());
    }

    @Test
    void refuseUneImageTropPetitePourLeCadre() throws Exception {
        IllegalArgumentException erreur = assertThrows(IllegalArgumentException.class, () -> stockage().stocker(
            fichier("vignette.png", "image/png", image("png", 399, 225))));
        assertEquals("L’image est trop petite : au moins 400 × 225 pixels.", erreur.getMessage());
        assertThrows(IllegalArgumentException.class, () -> stockage().stocker(
            fichier("vignette.png", "image/png", image("png", 1600, 224))));
    }

    @Test
    void agranditUnePetiteImageAuFormatPlutotQueDeLaRefuser() throws Exception {
        StockageImageEvenement stockage = stockage();
        String url = stockage.stocker(fichier("petite.jpg", "image/jpeg", image("jpg", 400, 225)));
        BufferedImage stockee = lireImage(stockage, url);
        assertEquals(1600, stockee.getWidth());
        assertEquals(900, stockee.getHeight());
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
        String url = stockage.stocker(fichier("affiche.png", "image/png", image("png", 800, 450)));
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

    private BufferedImage lireImage(StockageImageEvenement stockage, String url) throws Exception {
        try (InputStream contenu = stockage.lire(nom(url)).getInputStream()) {
            return ImageIO.read(contenu);
        }
    }

    private static void assertBleu(int rgb) {
        Color couleur = new Color(rgb);
        assertTrue(couleur.getBlue() > 200 && couleur.getRed() < 40 && couleur.getGreen() < 40, couleur.toString());
    }

    private static byte[] encoder(BufferedImage image, String format) throws Exception {
        ByteArrayOutputStream sortie = new ByteArrayOutputStream();
        ImageIO.write(image, format, sortie);
        return sortie.toByteArray();
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
