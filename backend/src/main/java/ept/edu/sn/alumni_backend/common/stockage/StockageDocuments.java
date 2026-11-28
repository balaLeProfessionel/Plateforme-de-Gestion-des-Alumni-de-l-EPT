package ept.edu.sn.alumni_backend.common.stockage;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * Documents PDF envoyés par les membres (pièces jointes d'offre, puis CV et rapports de stage). Le type, l'extension
 * et la signature « %PDF- » sont vérifiés ; le fichier est rangé sous un nom aléatoire et n'est jamais servi
 * directement : le service qui le lit contrôle d'abord qui y a droit.
 */
public class StockageDocuments {
    private static final String MOTIF_NOM = "[0-9a-fA-F-]{36}\\.pdf";
    private static final byte[] SIGNATURE_PDF = {'%', 'P', 'D', 'F', '-'};

    private final DepotFichiers depot;
    private final String dossier;
    private final long tailleMaximale;

    public StockageDocuments(DepotFichiers depot, String dossier, long tailleMaximale) {
        this.depot = depot;
        this.dossier = dossier;
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
            depot.ecrire(DepotFichiers.cle(dossier, nom), contenu);
            return nom;
        } catch (IOException e) {
            throw new StockageFichierException("Impossible d’enregistrer le fichier.", e);
        }
    }

    public Resource lire(String nom) {
        return depot.lire(cleValide(nom)).orElseThrow(FichierIntrouvableException::new);
    }

    /** Copie un document déjà stocké sous un nouveau nom, pour qu'il vive indépendamment de l'original. */
    public String copier(String nom) {
        try (var flux = lire(nom).getInputStream()) {
            String copie = UUID.randomUUID() + ".pdf";
            depot.ecrire(DepotFichiers.cle(dossier, copie), flux.readAllBytes());
            return copie;
        } catch (IOException e) {
            throw new StockageFichierException("Impossible de copier le fichier.", e);
        }
    }

    public void supprimer(String nom) {
        try {
            depot.supprimer(cleValide(nom));
        } catch (IOException e) {
            throw new StockageFichierException("Impossible de supprimer le fichier.", e);
        }
    }

    private String cleValide(String nom) {
        if (nom == null || !nom.matches(MOTIF_NOM)) throw new FichierIntrouvableException();
        return DepotFichiers.cle(dossier, nom);
    }

    private static boolean commencePar(byte[] contenu, byte[] prefixe) {
        if (contenu.length < prefixe.length) return false;
        for (int i = 0; i < prefixe.length; i++) {
            if (contenu[i] != prefixe[i]) return false;
        }
        return true;
    }
}
