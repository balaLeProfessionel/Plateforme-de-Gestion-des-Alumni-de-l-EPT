package ept.edu.sn.alumni_backend.cv.lecture;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.image.FormatImage;
import ept.edu.sn.alumni_backend.cv.extraction.ContenuCv;

/**
 * Transforme les fichiers déposés en contenu à envoyer à l'IA, sans jamais les écrire sur disque :
 * le texte quand le document en contient (PDF, Word), sinon des images JPEG réencodées
 * (réduites, sans métadonnées ni position GPS).
 */
@Component
public class LecteurCv {
    public static final int FICHIERS_MAX = 6;
    public static final long TAILLE_MAX_OCTETS = 10L * 1024 * 1024;
    private static final long TAILLE_MAX_TOTALE_OCTETS = 30L * 1024 * 1024;
    /** En dessous, le PDF est considéré comme scanné : on l'envoie en images. */
    private static final int CARACTERES_MIN_TEXTE = 200;
    private static final int CARACTERES_MAX_TEXTE = 40_000;
    /** Grand côté des images envoyées : suffisant pour lire un CV, et limite le coût. */
    private static final int COTE_MAX_IMAGE = 1568;
    private static final long PIXELS_MAX_SOURCE = 40_000_000L;
    private static final float DPI_RENDU_PDF = 150f;

    private enum Format { PDF, DOCX, IMAGE }

    public ContenuCv lire(List<MultipartFile> fichiers, boolean imagesAcceptees) {
        if (fichiers == null || fichiers.isEmpty()) {
            throw new FichierCvInvalideException("Déposez votre CV.");
        }
        if (fichiers.size() > FICHIERS_MAX) {
            throw new FichierCvInvalideException("Six fichiers au plus : réunissez vos captures en moins d'images.");
        }
        if (fichiers.stream().mapToLong(MultipartFile::getSize).sum() > TAILLE_MAX_TOTALE_OCTETS) {
            throw new FichierCvInvalideException("L'ensemble des fichiers doit faire 30 Mo au plus.");
        }

        List<byte[]> contenus = new ArrayList<>();
        List<Format> formats = new ArrayList<>();
        for (MultipartFile fichier : fichiers) {
            if (fichier.isEmpty()) {
                throw new FichierCvInvalideException("Un des fichiers est vide.");
            }
            if (fichier.getSize() > TAILLE_MAX_OCTETS) {
                throw new FichierCvInvalideException("Chaque fichier doit faire 10 Mo au plus.");
            }
            byte[] octets = octets(fichier);
            contenus.add(octets);
            formats.add(reconnaitre(octets));
        }

        boolean unDocument = formats.stream().anyMatch(f -> f != Format.IMAGE);
        if (unDocument && fichiers.size() > 1) {
            throw new FichierCvInvalideException("Déposez un seul PDF ou fichier Word, ou jusqu'à six images.");
        }

        if (formats.get(0) == Format.DOCX) {
            return ContenuCv.texte(texteWord(contenus.get(0)));
        }
        if (formats.get(0) == Format.PDF) {
            return contenuPdf(contenus.get(0), imagesAcceptees);
        }
        if (!imagesAcceptees) {
            throw new FichierCvInvalideException(
                "Les images ne sont pas acceptées pour le moment : déposez un PDF ou un fichier Word.");
        }
        List<byte[]> images = new ArrayList<>();
        for (byte[] contenu : contenus) {
            images.add(jpegReduit(lireImage(contenu)));
        }
        return ContenuCv.images(images);
    }

    private static byte[] octets(MultipartFile fichier) {
        try {
            return fichier.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** D'après les premiers octets, jamais d'après le nom ou le type annoncé par le navigateur. */
    private static Format reconnaitre(byte[] o) {
        if (commencePar(o, 0x25, 0x50, 0x44, 0x46)) return Format.PDF;                  // %PDF
        if (commencePar(o, 0x50, 0x4B, 0x03, 0x04)) return Format.DOCX;                 // ZIP (vérifié à la lecture)
        if (commencePar(o, 0xFF, 0xD8, 0xFF)) return Format.IMAGE;                      // JPEG
        if (commencePar(o, 0x89, 0x50, 0x4E, 0x47)) return Format.IMAGE;                // PNG
        if (commencePar(o, 0x52, 0x49, 0x46, 0x46) && o.length > 12
            && o[8] == 'W' && o[9] == 'E' && o[10] == 'B' && o[11] == 'P') return Format.IMAGE;
        throw new FichierCvInvalideException(
            "Format non reconnu : déposez un PDF, un fichier Word (.docx) ou des images JPG, PNG ou WebP.");
    }

    private static boolean commencePar(byte[] octets, int... signature) {
        if (octets.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((octets[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private static String texteWord(byte[] octets) {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(octets));
             XWPFWordExtractor extracteur = new XWPFWordExtractor(document)) {
            String texte = nettoyer(extracteur.getText());
            if (nombreDeCaracteres(texte) < 20) {
                throw new FichierCvInvalideException("Ce fichier Word ne contient pas de texte lisible.");
            }
            return texte;
        } catch (IOException | RuntimeException e) {
            if (e instanceof FichierCvInvalideException fichierInvalide) throw fichierInvalide;
            throw new FichierCvInvalideException("Ce fichier n'est pas un document Word (.docx) lisible.");
        }
    }

    private static ContenuCv contenuPdf(byte[] octets, boolean imagesAcceptees) {
        try (PDDocument document = Loader.loadPDF(octets)) {
            PDFTextStripper lecteur = new PDFTextStripper();
            lecteur.setSortByPosition(true);
            String texte = nettoyer(lecteur.getText(document));
            if (nombreDeCaracteres(texte) >= CARACTERES_MIN_TEXTE) {
                return ContenuCv.texte(texte);
            }
            if (!imagesAcceptees) {
                throw new FichierCvInvalideException(
                    "Ce PDF est une image scannée, qui ne peut pas être lue pour le moment : remplissez votre profil à la main.");
            }
            PDFRenderer rendu = new PDFRenderer(document);
            int pages = Math.min(document.getNumberOfPages(), FICHIERS_MAX);
            List<byte[]> images = new ArrayList<>();
            for (int page = 0; page < pages; page++) {
                images.add(jpegReduit(rendu.renderImageWithDPI(page, DPI_RENDU_PDF, ImageType.RGB)));
            }
            if (images.isEmpty()) {
                throw new FichierCvInvalideException("Ce PDF ne contient aucune page.");
            }
            return ContenuCv.images(images);
        } catch (InvalidPasswordException e) {
            throw new FichierCvInvalideException("Ce PDF est protégé par un mot de passe : déposez une version sans protection.");
        } catch (IOException e) {
            throw new FichierCvInvalideException("Ce PDF est illisible ou endommagé.");
        }
    }

    private static BufferedImage lireImage(byte[] octets) {
        try (ImageInputStream entree = ImageIO.createImageInputStream(new ByteArrayInputStream(octets))) {
            Iterator<ImageReader> lecteurs = entree == null ? null : ImageIO.getImageReaders(entree);
            if (lecteurs == null || !lecteurs.hasNext()) {
                throw new FichierCvInvalideException("Cette image est illisible.");
            }
            ImageReader lecteur = lecteurs.next();
            try {
                lecteur.setInput(entree, true, true);
                // Dimensions lues avant le décodage : une image piégée ne peut pas saturer la mémoire
                long pixels = (long) lecteur.getWidth(0) * lecteur.getHeight(0);
                if (pixels > PIXELS_MAX_SOURCE) {
                    throw new FichierCvInvalideException("Cette image est trop grande (40 mégapixels au plus).");
                }
                return lecteur.read(0);
            } finally {
                lecteur.dispose();
            }
        } catch (IOException e) {
            throw new FichierCvInvalideException("Cette image est illisible.");
        }
    }

    /** Réduit au besoin, aplatit la transparence sur fond blanc et réencode : les métadonnées disparaissent. */
    private static byte[] jpegReduit(BufferedImage source) {
        double echelle = Math.min(1d, (double) COTE_MAX_IMAGE / Math.max(source.getWidth(), source.getHeight()));
        int largeur = Math.max(1, (int) Math.round(source.getWidth() * echelle));
        int hauteur = Math.max(1, (int) Math.round(source.getHeight() * echelle));
        BufferedImage cible = new BufferedImage(largeur, hauteur, BufferedImage.TYPE_INT_RGB);
        Graphics2D dessin = cible.createGraphics();
        try {
            dessin.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            dessin.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            dessin.setColor(Color.WHITE);
            dessin.fillRect(0, 0, largeur, hauteur);
            dessin.drawImage(source, 0, 0, largeur, hauteur, null);
        } finally {
            dessin.dispose();
        }
        try {
            return FormatImage.encoderJpeg(cible);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static String nettoyer(String texte) {
        String propre = texte == null ? "" : texte
            .replace('\u0000', ' ')
            .replaceAll("[ \\t\\x0B\\f\\r]+", " ")
            .replaceAll("\\n\\s*\\n+", "\n\n")
            .trim();
        return propre.length() > CARACTERES_MAX_TEXTE ? propre.substring(0, CARACTERES_MAX_TEXTE) : propre;
    }

    private static long nombreDeCaracteres(String texte) {
        return texte.chars().filter(c -> !Character.isWhitespace(c)).count();
    }
}
