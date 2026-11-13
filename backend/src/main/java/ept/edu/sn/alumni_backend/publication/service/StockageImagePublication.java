package ept.edu.sn.alumni_backend.publication.service;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import ept.edu.sn.alumni_backend.publication.exception.PublicationIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoException;

@Service
public class StockageImagePublication {
    private final Path repertoire;
    private final long tailleMax;

    public StockageImagePublication(@Value("${app.storage.photos.dir:./data/photos}") String repertoire,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMax) {
        this.repertoire = Path.of(repertoire).toAbsolutePath().normalize().resolve("publications");
        this.tailleMax = tailleMax.toBytes();
    }

    public String stocker(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty() || fichier.getSize() > tailleMax)
            throw new IllegalArgumentException("Choisissez une image de 5 Mo maximum.");
        String nom = fichier.getOriginalFilename() == null ? "" : fichier.getOriginalFilename().toLowerCase(Locale.ROOT);
        String type = fichier.getContentType();
        boolean png = "image/png".equals(type) && nom.endsWith(".png");
        boolean jpeg = "image/jpeg".equals(type) && (nom.endsWith(".jpg") || nom.endsWith(".jpeg"));
        if (!png && !jpeg) throw new IllegalArgumentException("Choisissez une image JPEG ou PNG valide.");
        Path destination = null;
        try {
            byte[] bytes = fichier.getBytes();
            boolean signaturePng = bytes.length >= 8 && (bytes[0] & 255) == 137 && bytes[1] == 80 && bytes[2] == 78 && bytes[3] == 71 && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10;
            boolean signatureJpeg = bytes.length >= 3 && (bytes[0] & 255) == 255 && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255;
            if ((png && !signaturePng) || (jpeg && !signatureJpeg)) throw new IllegalArgumentException("Le contenu de l’image est invalide.");
            BufferedImage image;
            try (ImageInputStream entree = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                if (entree == null) throw new IllegalArgumentException("Le contenu de l’image est invalide.");
                Iterator<ImageReader> lecteurs = ImageIO.getImageReaders(entree);
                if (!lecteurs.hasNext()) throw new IllegalArgumentException("Le contenu de l’image est invalide.");
                ImageReader lecteur = lecteurs.next();
                try {
                    lecteur.setInput(entree, true, true);
                    int largeur = lecteur.getWidth(0), hauteur = lecteur.getHeight(0);
                    if (largeur < 1 || hauteur < 1 || (long) largeur * hauteur > 20_000_000)
                        throw new IllegalArgumentException("Les dimensions de l’image sont invalides.");
                    image = lecteur.read(0);
                    if (image == null) throw new IllegalArgumentException("Le contenu de l’image est invalide.");
                } finally { lecteur.dispose(); }
            }
            double ratio = Math.min(1, 1600.0 / Math.max(image.getWidth(), image.getHeight()));
            BufferedImage resultat = new BufferedImage(Math.max(1, (int) Math.round(image.getWidth() * ratio)),
                Math.max(1, (int) Math.round(image.getHeight() * ratio)), BufferedImage.TYPE_INT_ARGB);
            Graphics2D graphisme = resultat.createGraphics();
            try {
                graphisme.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphisme.drawImage(image, 0, 0, resultat.getWidth(), resultat.getHeight(), null);
            } finally { graphisme.dispose(); }
            Files.createDirectories(repertoire);
            String identifiant = UUID.randomUUID().toString();
            destination = repertoire.resolve(identifiant + ".png");
            if (!ImageIO.write(resultat, "png", destination.toFile())) throw new IOException("Encodeur indisponible");
            return identifiant;
        } catch (IOException e) {
            if (destination != null) try { Files.deleteIfExists(destination); } catch (IOException ignored) { }
            throw new StockagePhotoException("Impossible d’enregistrer l’image.", e);
        }
    }

    public Resource lire(String identifiant) {
        try {
            UUID.fromString(identifiant);
            Resource image = new UrlResource(repertoire.resolve(identifiant + ".png").toUri());
            if (!image.exists() || !image.isReadable()) throw new PublicationIntrouvableException();
            return image;
        } catch (IllegalArgumentException | IOException e) { throw new PublicationIntrouvableException(); }
    }

    public void supprimer(String identifiant) {
        try { Files.deleteIfExists(repertoire.resolve(UUID.fromString(identifiant) + ".png")); }
        catch (IOException e) { throw new StockagePhotoException("Impossible de supprimer l’image.", e); }
    }
}
