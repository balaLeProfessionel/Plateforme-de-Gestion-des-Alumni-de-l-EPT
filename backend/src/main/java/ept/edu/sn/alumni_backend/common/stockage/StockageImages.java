package ept.edu.sn.alumni_backend.common.stockage;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.image.FormatImage;

/**
 * Images envoyées par les membres, stockées dans un répertoire et servies sous un préfixe d'URL : JPEG ou PNG vérifié
 * par sa signature, décodé, puis réécrit en JPEG au format imposé (FormatImage). Même traitement que les images
 * d'événement, réutilisable par chaque domaine.
 */
public class StockageImages {
    private static final long PIXELS_SOURCE_MAXIMAUX = 20_000_000;
    private static final String MOTIF_NOM = "[0-9a-fA-F-]{36}\\.jpg";

    private final Path repertoire;
    private final String prefixePublic;
    private final FormatImage format;
    private final long tailleMaximale;

    public StockageImages(Path repertoire, String prefixePublic, FormatImage format, long tailleMaximale) {
        this.repertoire = repertoire.toAbsolutePath().normalize();
        this.prefixePublic = prefixePublic;
        this.format = format;
        this.tailleMaximale = tailleMaximale;
    }

    /** Écrit l'image et renvoie son URL publique. */
    public String stocker(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Sélectionnez une image.");
        }
        if (fichier.getSize() > tailleMaximale) {
            throw new IllegalArgumentException("L’image ne doit pas dépasser " + tailleMaximale / (1024 * 1024) + " Mo.");
        }
        String type = fichier.getContentType();
        String nomOriginal = fichier.getOriginalFilename() == null ? "" : fichier.getOriginalFilename().toLowerCase(Locale.ROOT);
        boolean png = "image/png".equals(type) && nomOriginal.endsWith(".png");
        boolean jpeg = "image/jpeg".equals(type) && (nomOriginal.endsWith(".jpg") || nomOriginal.endsWith(".jpeg"));
        if (!png && !jpeg) {
            throw new IllegalArgumentException("Choisissez une image JPEG ou PNG valide.");
        }
        try {
            byte[] contenu = fichier.getBytes();
            verifierSignature(contenu, png);
            BufferedImage source = decoder(contenu);
            format.verifierTailleMinimale(source);
            String nom = UUID.randomUUID() + ".jpg";
            Files.createDirectories(repertoire);
            Path temporaire = Files.createTempFile(repertoire, "image-", ".tmp");
            try {
                FormatImage.ecrireJpeg(format.appliquer(source), temporaire);
                deplacer(temporaire, chemin(nom));
            } finally {
                Files.deleteIfExists(temporaire);
            }
            return prefixePublic + nom;
        } catch (IOException e) {
            throw new StockageFichierException("Impossible d’enregistrer l’image.", e);
        }
    }

    public Resource lire(String nom) {
        if (!nom.matches(MOTIF_NOM)) {
            throw new FichierIntrouvableException();
        }
        try {
            Resource resource = new UrlResource(chemin(nom).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new FichierIntrouvableException();
            }
            return resource;
        } catch (IOException e) {
            throw new FichierIntrouvableException();
        }
    }

    /** Supprime l'image si l'URL désigne une image de ce stockage ; ignore toute autre URL. */
    public void supprimerSiGeree(String url) {
        if (url == null || !url.startsWith(prefixePublic)) return;
        String nom = url.substring(prefixePublic.length());
        if (!nom.matches(MOTIF_NOM)) return;
        try {
            Files.deleteIfExists(chemin(nom));
        } catch (IOException e) {
            throw new StockageFichierException("Impossible de supprimer une ancienne image.", e);
        }
    }

    private BufferedImage decoder(byte[] contenu) throws IOException {
        try (ImageInputStream entree = ImageIO.createImageInputStream(new ByteArrayInputStream(contenu))) {
            Iterator<ImageReader> lecteurs = entree == null ? null : ImageIO.getImageReaders(entree);
            if (lecteurs == null || !lecteurs.hasNext()) throw new IllegalArgumentException("Le fichier ne contient pas une image valide.");
            ImageReader lecteur = lecteurs.next();
            try {
                lecteur.setInput(entree, true, true);
                int largeur = lecteur.getWidth(0);
                int hauteur = lecteur.getHeight(0);
                if (largeur < 1 || hauteur < 1 || (long) largeur * hauteur > PIXELS_SOURCE_MAXIMAUX) {
                    throw new IllegalArgumentException("Les dimensions de l’image sont trop grandes.");
                }
                BufferedImage image = lecteur.read(0);
                if (image == null) throw new IllegalArgumentException("Le fichier ne contient pas une image valide.");
                return image;
            } finally {
                lecteur.dispose();
            }
        }
    }

    private static void verifierSignature(byte[] contenu, boolean png) {
        boolean signaturePng = contenu.length >= 8 && (contenu[0] & 0xff) == 0x89 && contenu[1] == 0x50 && contenu[2] == 0x4e
            && contenu[3] == 0x47 && contenu[4] == 0x0d && contenu[5] == 0x0a && contenu[6] == 0x1a && contenu[7] == 0x0a;
        boolean signatureJpeg = contenu.length >= 3 && (contenu[0] & 0xff) == 0xff && (contenu[1] & 0xff) == 0xd8 && (contenu[2] & 0xff) == 0xff;
        if (png ? !signaturePng : !signatureJpeg) {
            throw new IllegalArgumentException("Le contenu du fichier ne correspond pas à son format.");
        }
    }

    private Path chemin(String nom) throws IOException {
        Path chemin = repertoire.resolve(nom).normalize();
        if (!chemin.startsWith(repertoire)) throw new IOException("Chemin de stockage invalide.");
        return chemin;
    }

    static void deplacer(Path source, Path destination) throws IOException {
        try {
            Files.move(source, destination, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(source, destination, StandardCopyOption.REPLACE_EXISTING);
        }
    }
}
