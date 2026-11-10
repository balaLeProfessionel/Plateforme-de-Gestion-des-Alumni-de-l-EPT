package ept.edu.sn.alumni_backend.common.stockage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Documents PDF envoyés par les membres (pièces jointes d'offre, puis CV et rapports de stage). Le type, l'extension
 * et la signature « %PDF- » sont vérifiés ; le fichier est rangé sous un nom aléatoire et n'est jamais servi
 * directement : le service qui le lit contrôle d'abord qui y a droit.
 */
public class StockageDocuments {
    private static final String MOTIF_NOM = "[0-9a-fA-F-]{36}\\.pdf";
    private static final byte[] SIGNATURE_PDF = {'%', 'P', 'D', 'F', '-'};

    private final Path repertoire;
    private final long tailleMaximale;

    public StockageDocuments(Path repertoire, long tailleMaximale) {
        this.repertoire = repertoire.toAbsolutePath().normalize();
        this.tailleMaximale = tailleMaximale;
    }

    /** Écrit le PDF et renvoie son nom de stockage. */
    public String stocker(MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new IllegalArgumentException("Sélectionnez un fichier PDF.");
        }
        if (fichier.getSize() > tailleMaximale) {
            throw new IllegalArgumentException("Le fichier ne doit pas dépasser " + tailleMaximale / (1024 * 1024) + " Mo.");
        }
        String nomOriginal = fichier.getOriginalFilename() == null ? "" : fichier.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!"application/pdf".equals(fichier.getContentType()) || !nomOriginal.endsWith(".pdf")) {
            throw new IllegalArgumentException("Seuls les fichiers PDF sont acceptés.");
        }
        try {
            byte[] contenu = fichier.getBytes();
            if (!commencePar(contenu, SIGNATURE_PDF)) {
                throw new IllegalArgumentException("Le contenu du fichier n’est pas un PDF valide.");
            }
            String nom = UUID.randomUUID() + ".pdf";
            Files.createDirectories(repertoire);
            Path temporaire = Files.createTempFile(repertoire, "document-", ".tmp");
            try {
                Files.write(temporaire, contenu);
                StockageImages.deplacer(temporaire, chemin(nom));
            } finally {
                Files.deleteIfExists(temporaire);
            }
            return nom;
        } catch (IOException e) {
            throw new StockageFichierException("Impossible d’enregistrer le fichier.", e);
        }
    }

    public Resource lire(String nom) {
        try {
            Resource resource = new UrlResource(cheminValide(nom).toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new FichierIntrouvableException();
            }
            return resource;
        } catch (IOException e) {
            throw new FichierIntrouvableException();
        }
    }

    public void supprimer(String nom) {
        try {
            Files.deleteIfExists(cheminValide(nom));
        } catch (IOException e) {
            throw new StockageFichierException("Impossible de supprimer le fichier.", e);
        }
    }

    private Path cheminValide(String nom) throws IOException {
        if (nom == null || !nom.matches(MOTIF_NOM)) throw new FichierIntrouvableException();
        return chemin(nom);
    }

    private Path chemin(String nom) throws IOException {
        Path chemin = repertoire.resolve(nom).normalize();
        if (!chemin.startsWith(repertoire)) throw new IOException("Chemin de stockage invalide.");
        return chemin;
    }

    private static boolean commencePar(byte[] contenu, byte[] prefixe) {
        if (contenu.length < prefixe.length) return false;
        for (int i = 0; i < prefixe.length; i++) {
            if (contenu[i] != prefixe[i]) return false;
        }
        return true;
    }
}
