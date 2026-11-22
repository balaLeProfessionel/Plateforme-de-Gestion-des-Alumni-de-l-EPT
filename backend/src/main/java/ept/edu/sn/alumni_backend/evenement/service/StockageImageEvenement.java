package ept.edu.sn.alumni_backend.evenement.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.common.image.FormatImage;
import ept.edu.sn.alumni_backend.common.stockage.DepotFichiers;
import ept.edu.sn.alumni_backend.evenement.exception.ImageEvenementIntrouvableException;
import ept.edu.sn.alumni_backend.evenement.exception.StockageImageEvenementException;

@Service
public class StockageImageEvenement {
    private static final Set<String> FORMATS_ACCEPTES = Set.of("image/jpeg", "image/png");
    private static final long PIXELS_SOURCE_MAXIMAUX = 20_000_000;
    private static final String PREFIXE_PUBLIC = "/api/evenement-images/";

    private static final String DOSSIER = "evenements";

    private final DepotFichiers depot;
    private final long tailleMaximale;

    public StockageImageEvenement(
            DepotFichiers depot,
            @Value("${app.storage.photos.max-size:5MB}") DataSize tailleMaximale) {
        this.depot = depot;
        this.tailleMaximale = tailleMaximale.toBytes();
    }

    public String stocker(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Sélectionnez une image pour l’événement.");
        }
        if (fichier.getSize() > tailleMaximale) {
            throw new IllegalArgumentException("L’image ne doit pas dépasser 5 Mo.");
        }
        String type = fichier.getContentType();
        String nomOriginal = fichier.getOriginalFilename() == null
            ? "" : fichier.getOriginalFilename().toLowerCase(java.util.Locale.ROOT);
        boolean extensionValide = "image/png".equals(type)
            ? nomOriginal.endsWith(".png")
            : "image/jpeg".equals(type) && (nomOriginal.endsWith(".jpg") || nomOriginal.endsWith(".jpeg"));
        if (type == null || !FORMATS_ACCEPTES.contains(type) || !extensionValide) {
            throw new IllegalArgumentException("Choisissez une image JPEG ou PNG valide.");
        }

        try {
            byte[] contenu = fichier.getBytes();
            verifierSignature(contenu, type);
            BufferedImage source = decoder(contenu);
            FormatImage.EVENEMENT.verifierTailleMinimale(source);
            String nom = UUID.randomUUID() + ".jpg";
            // Format imposé : 1600 × 900 (16:9), recadré au centre si l'image n'a pas ce rapport.
            depot.ecrire(DepotFichiers.cle(DOSSIER, nom), FormatImage.encoderJpeg(FormatImage.EVENEMENT.appliquer(source)));
            return PREFIXE_PUBLIC + nom;
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (IOException e) {
            throw new StockageImageEvenementException("Impossible d’enregistrer l’image de l’événement.", e);
        }
    }

    public Resource lire(String nom) {
        if (!nom.matches("[0-9a-fA-F-]{36}\\.(jpg|png)")) {
            throw new IllegalArgumentException("Image d’événement invalide.");
        }
        return depot.lire(DepotFichiers.cle(DOSSIER, nom)).orElseThrow(ImageEvenementIntrouvableException::new);
    }

    public void supprimerSiGeree(String url) {
        if (url == null || !url.startsWith(PREFIXE_PUBLIC)) return;
        String nom = url.substring(PREFIXE_PUBLIC.length());
        if (!nom.matches("[0-9a-fA-F-]{36}\\.(jpg|png)")) return;
        try {
            depot.supprimer(DepotFichiers.cle(DOSSIER, nom));
        } catch (IOException e) {
            throw new StockageImageEvenementException("Impossible de supprimer une ancienne image.", e);
        }
    }

    private BufferedImage decoder(byte[] contenu) throws IOException {
        try (ImageInputStream entree = ImageIO.createImageInputStream(new ByteArrayInputStream(contenu))) {
            if (entree == null) throw new IllegalArgumentException("Le fichier ne contient pas une image valide.");
            Iterator<ImageReader> lecteurs = ImageIO.getImageReaders(entree);
            if (!lecteurs.hasNext()) throw new IllegalArgumentException("Le fichier ne contient pas une image valide.");
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
    private void verifierSignature(byte[] contenu, String type) {
        boolean jpeg = contenu.length >= 3 && (contenu[0] & 0xff) == 0xff
            && (contenu[1] & 0xff) == 0xd8 && (contenu[2] & 0xff) == 0xff;
        boolean png = contenu.length >= 8 && (contenu[0] & 0xff) == 0x89
            && contenu[1] == 0x50 && contenu[2] == 0x4e && contenu[3] == 0x47
            && contenu[4] == 0x0d && contenu[5] == 0x0a && contenu[6] == 0x1a && contenu[7] == 0x0a;
        if (("image/jpeg".equals(type) && !jpeg) || ("image/png".equals(type) && !png)) {
            throw new IllegalArgumentException("Le contenu du fichier ne correspond pas à son format.");
        }
    }
}
