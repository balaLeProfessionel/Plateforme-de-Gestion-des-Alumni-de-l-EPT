package ept.edu.sn.alumni_backend.common.image;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Iterator;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;

/**
 * Format standard imposé aux images envoyées par les membres : quelle que soit l'image reçue,
 * on stocke exactement le cadre attendu (recadrage centré si le rapport diffère), en JPEG.
 * Le frontend propose un recadrage manuel ; ce traitement garantit le format même sans lui.
 */
public record FormatImage(int largeur, int hauteur, int largeurMinimale, int hauteurMinimale) {
    /** Images d'événement : 16:9. */
    public static final FormatImage EVENEMENT = new FormatImage(1600, 900, 800, 450);
    /** Photos de profil : carré. */
    public static final FormatImage PHOTO_PROFIL = new FormatImage(600, 600, 200, 200);

    private static final float QUALITE_JPEG = 0.86f;

    /** Refuse une image trop petite pour remplir le cadre sans devenir floue. */
    public void verifierTailleMinimale(BufferedImage source) {
        if (source.getWidth() < largeurMinimale || source.getHeight() < hauteurMinimale) {
            throw new IllegalArgumentException("L’image est trop petite : au moins "
                + largeurMinimale + " × " + hauteurMinimale + " pixels.");
        }
    }

    /** Recadre au centre au rapport du format, puis redimensionne exactement à largeur × hauteur. */
    public BufferedImage appliquer(BufferedImage source) {
        double rapportCible = (double) largeur / hauteur;
        double rapportSource = (double) source.getWidth() / source.getHeight();
        int largeurCadre = source.getWidth();
        int hauteurCadre = source.getHeight();
        if (rapportSource > rapportCible) {
            largeurCadre = (int) Math.round(hauteurCadre * rapportCible);
        } else if (rapportSource < rapportCible) {
            hauteurCadre = (int) Math.round(largeurCadre / rapportCible);
        }
        int x = (source.getWidth() - largeurCadre) / 2;
        int y = (source.getHeight() - hauteurCadre) / 2;
        BufferedImage cadre = copierSurFondBlanc(source.getSubimage(x, y, largeurCadre, hauteurCadre));
        return redimensionner(cadre, largeur, hauteur);
    }

    /** Écrit l'image en JPEG à qualité maîtrisée (ImageIO.write ne permet pas de la régler). */
    public static void ecrireJpeg(BufferedImage image, Path destination) throws IOException {
        Iterator<ImageWriter> ecrivains = ImageIO.getImageWritersByFormatName("jpeg");
        if (!ecrivains.hasNext()) throw new IOException("Aucun encodeur JPEG disponible.");
        ImageWriter ecrivain = ecrivains.next();
        try (ImageOutputStream sortie = ImageIO.createImageOutputStream(destination.toFile())) {
            ImageWriteParam parametres = ecrivain.getDefaultWriteParam();
            parametres.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            parametres.setCompressionQuality(QUALITE_JPEG);
            ecrivain.setOutput(sortie);
            ecrivain.write(null, new IIOImage(image, null, null), parametres);
        } finally {
            ecrivain.dispose();
        }
    }

    /** JPEG n'a pas de transparence : un PNG transparent prend un fond blanc plutôt que noir. */
    private static BufferedImage copierSurFondBlanc(BufferedImage source) {
        BufferedImage copie = new BufferedImage(source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = copie.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, copie.getWidth(), copie.getHeight());
            graphics.drawImage(source, 0, 0, null);
        } finally {
            graphics.dispose();
        }
        return copie;
    }

    /** Réduction par paliers de moitié : nettement plus net qu'un seul passage bicubique. */
    private static BufferedImage redimensionner(BufferedImage source, int largeurCible, int hauteurCible) {
        BufferedImage courante = source;
        int largeur = source.getWidth();
        int hauteur = source.getHeight();
        do {
            largeur = largeur / 2 >= largeurCible ? largeur / 2 : largeurCible;
            hauteur = hauteur / 2 >= hauteurCible ? hauteur / 2 : hauteurCible;
            if (largeur < largeurCible) largeur = largeurCible;
            if (hauteur < hauteurCible) hauteur = hauteurCible;
            BufferedImage etape = new BufferedImage(largeur, hauteur, BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = etape.createGraphics();
            try {
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                graphics.drawImage(courante, 0, 0, largeur, hauteur, null);
            } finally {
                graphics.dispose();
            }
            courante = etape;
        } while (largeur != largeurCible || hauteur != hauteurCible);
        return courante;
    }
}
