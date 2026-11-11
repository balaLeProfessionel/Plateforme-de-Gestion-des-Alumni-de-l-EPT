package ept.edu.sn.alumni_backend.utilisateur.photo;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.image.FormatImage;
import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;

@Service
public class StockagePhotoProfil {
    private static final Set<String> TYPES_ACCEPTES = Set.of("image/jpeg", "image/png");
    private static final int DIMENSION_SOURCE_MAXIMALE = 10_000;
    private static final String PREFIXE_PUBLIC = "/api/photos/";

    private final DepotFichiers depot;
    private final long tailleMaximale;

    /** Les photos de profil sont à la racine du dépôt (emplacement historique, gardé pour les photos existantes). */
    public StockagePhotoProfil(
            DepotFichiers depot,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.depot = depot;
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

            FormatImage.PHOTO_PROFIL.verifierTailleMinimale(source);
            String nom = UUID.randomUUID() + ".jpg";
            // Format imposé : carré de 600 × 600, recadré au centre si besoin.
            depot.ecrire(nom, FormatImage.encoderJpeg(FormatImage.PHOTO_PROFIL.appliquer(source)));
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
        return depot.lire(nom).orElseThrow(PhotoIntrouvableException::new);
    }

    public void supprimerSiGeree(String url) {
        if (url == null || !url.startsWith(PREFIXE_PUBLIC)) return;
        String nom = url.substring(PREFIXE_PUBLIC.length());
        if (!nom.matches("[0-9a-fA-F-]{36}\\.(jpg|png)")) return;
        try {
            depot.supprimer(nom);
        } catch (IOException e) {
            throw new StockagePhotoException("Impossible de supprimer l’ancienne photo.", e);
        }
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
}
