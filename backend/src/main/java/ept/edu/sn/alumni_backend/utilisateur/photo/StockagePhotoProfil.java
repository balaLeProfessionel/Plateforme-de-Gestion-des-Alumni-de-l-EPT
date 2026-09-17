package ept.edu.sn.alumni_backend.utilisateur.photo;

import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

@Service
public class StockagePhotoProfil {
    private static final Set<String> TYPES_ACCEPTES = Set.of("image/jpeg", "image/png");
    private static final int DIMENSION_MAXIMALE = 800;
    private static final int DIMENSION_SOURCE_MAXIMALE = 10_000;
    private static final String PREFIXE_PUBLIC = "/api/photos/";

    private final Path repertoire;
    private final long tailleMaximale;

    public StockagePhotoProfil(
            @Value("${app.storage.photos.dir:./data/photos}") String repertoire,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.repertoire = Path.of(repertoire).toAbsolutePath().normalize();
        this.tailleMaximale = tailleMaximale.toBytes();
    }

    public String stocker(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Sélectionnez une photo.");
        }
        if (fichier.getSize() > tailleMaximale) {
            throw new IllegalArgumentException("La photo ne doit pas dépasser 5 Mo.");
        }
        String type = fichier.getContentType();
        if (!TYPES_ACCEPTES.contains(type)) {
            throw new IllegalArgumentException("Seules les images JPEG et PNG sont acceptées.");
        }
        String nomOriginal = fichier.getOriginalFilename() == null
            ? "" : fichier.getOriginalFilename().toLowerCase(Locale.ROOT);
        boolean extensionValide = type.equals("image/png")
            ? nomOriginal.endsWith(".png")
            : nomOriginal.endsWith(".jpg") || nomOriginal.endsWith(".jpeg");
        if (!extensionValide) {
            throw new IllegalArgumentException("L’extension du fichier ne correspond pas à son format.");
        }

        try {
            byte[] contenu = fichier.getBytes();
            verifierSignature(contenu, type);
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(contenu));
            if (source == null || source.getWidth() > DIMENSION_SOURCE_MAXIMALE
                    || source.getHeight() > DIMENSION_SOURCE_MAXIMALE) {
                throw new IllegalArgumentException("Le fichier ne contient pas une image valide.");
            }

            String format = type.equals("image/png") ? "png" : "jpg";
            String nom = UUID.randomUUID() + "." + format;
            Files.createDirectories(repertoire);
            Path destination = cheminSecurise(nom);
            Path temporaire = Files.createTempFile(repertoire, "photo-", ".tmp");
            try {
                BufferedImage redimensionnee = redimensionner(source, format);
                if (!ImageIO.write(redimensionnee, format, temporaire.toFile())) {
                    throw new IllegalArgumentException("Le format de l’image ne peut pas être traité.");
                }
                Files.move(temporaire, destination, StandardCopyOption.ATOMIC_MOVE);
            } finally {
                Files.deleteIfExists(temporaire);
            }
            return PREFIXE_PUBLIC + nom;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (IOException e) {
            throw new StockagePhotoException("Impossible d’enregistrer la photo.", e);
        }
    }

    public Resource lire(String nom) {
        if (!nom.matches("[0-9a-fA-F-]{36}\\.(jpg|png)")) {
            throw new IllegalArgumentException("Photo invalide.");
        }
        try {
            Resource resource = new UrlResource(cheminSecurise(nom).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new PhotoIntrouvableException();
            }
            return resource;
        } catch (IOException e) {
            throw new PhotoIntrouvableException();
        }
    }

    public void supprimerSiGeree(String url) {
        if (url == null || !url.startsWith(PREFIXE_PUBLIC)) return;
        String nom = url.substring(PREFIXE_PUBLIC.length());
        if (!nom.matches("[0-9a-fA-F-]{36}\\.(jpg|png)")) return;
        try {
            Files.deleteIfExists(cheminSecurise(nom));
        } catch (IOException e) {
            throw new StockagePhotoException("Impossible de supprimer l’ancienne photo.", e);
        }
    }

    private Path cheminSecurise(String nom) throws IOException {
        Path chemin = repertoire.resolve(nom).normalize();
        if (!chemin.startsWith(repertoire)) {
            throw new IOException("Chemin de stockage invalide");
        }
        return chemin;
    }

    private void verifierSignature(byte[] contenu, String type) {
        boolean jpeg = contenu.length >= 3
            && (contenu[0] & 0xff) == 0xff && (contenu[1] & 0xff) == 0xd8 && (contenu[2] & 0xff) == 0xff;
        boolean png = contenu.length >= 8
            && (contenu[0] & 0xff) == 0x89 && contenu[1] == 0x50 && contenu[2] == 0x4e
            && contenu[3] == 0x47 && contenu[4] == 0x0d && contenu[5] == 0x0a
            && contenu[6] == 0x1a && contenu[7] == 0x0a;
        if ((type.equals("image/jpeg") && !jpeg) || (type.equals("image/png") && !png)) {
            throw new IllegalArgumentException("Le contenu du fichier ne correspond pas à son format.");
        }
    }

    private BufferedImage redimensionner(BufferedImage source, String format) {
        double ratio = Math.min(1d, (double) DIMENSION_MAXIMALE / Math.max(source.getWidth(), source.getHeight()));
        int largeur = Math.max(1, (int) Math.round(source.getWidth() * ratio));
        int hauteur = Math.max(1, (int) Math.round(source.getHeight() * ratio));
        int type = format.equals("png") ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB;
        BufferedImage cible = new BufferedImage(largeur, hauteur, type);
        Graphics2D graphics = cible.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.drawImage(source, 0, 0, largeur, hauteur, null);
        } finally {
            graphics.dispose();
        }
        return cible;
    }
}
