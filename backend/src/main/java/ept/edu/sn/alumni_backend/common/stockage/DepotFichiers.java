package ept.edu.sn.alumni_backend.common.stockage;

import java.io.IOException;
import java.util.Optional;

import org.springframework.core.io.Resource;

/**
 * Endroit où sont rangés les fichiers envoyés par les membres (photos, images, PDF). Un fichier est désigné par une
 * clé relative, par exemple « documents/cv/&lt;uuid&gt;.pdf » ; la base ne garde que le nom ou l'URL publique.
 *
 * <p>Les classes de stockage (StockageImages, StockageDocuments…) valident le contenu puis passent par cette
 * interface : changer d'emplacement (disque local, stockage objet compatible S3) ne demande qu'une nouvelle
 * implémentation, sans toucher aux services métier.
 */
public interface DepotFichiers {
    /** Écrit le contenu sous cette clé ; un lecteur ne voit jamais un fichier à moitié écrit. */
    void ecrire(String cle, byte[] contenu) throws IOException;

    /** Le fichier, ou vide s'il n'existe pas. */
    Optional<Resource> lire(String cle);

    /** Supprime le fichier s'il existe. */
    void supprimer(String cle) throws IOException;

    /** Clé d'un fichier rangé dans un dossier ; dossier vide = à la racine. */
    static String cle(String dossier, String nom) {
        return dossier == null || dossier.isEmpty() ? nom : dossier + "/" + nom;
    }
}
