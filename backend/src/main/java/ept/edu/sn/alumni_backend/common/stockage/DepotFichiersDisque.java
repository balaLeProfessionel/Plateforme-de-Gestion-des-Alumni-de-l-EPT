package ept.edu.sn.alumni_backend.common.stockage;

import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/**
 * Fichiers rangés sous un répertoire du disque (en Docker : le volume monté sur /data/alumni/photos). Convient tant
 * que l'API tourne en une seule instance ; ce répertoire se sauvegarde avec la base (scripts/sauvegarde.sh).
 */
@Component
public class DepotFichiersDisque implements DepotFichiers {
    private static final String MOTIF_CLE = "([a-z0-9-]+/)*[A-Za-z0-9-]+\\.[a-z]{3,4}";

    private final Path racine;

    public DepotFichiersDisque(@Value("${app.storage.photos.dir:./data/photos}") String racine) {
        this.racine = Path.of(racine).toAbsolutePath().normalize();
    }

    @Override
    public void ecrire(String cle, byte[] contenu) throws IOException {
        Path destination = chemin(cle);
        Files.createDirectories(destination.getParent());
        // Écriture dans un fichier temporaire du même répertoire, puis renommage : jamais de fichier partiel.
        Path temporaire = Files.createTempFile(destination.getParent(), "envoi-", ".tmp");
        try {
            Files.write(temporaire, contenu);
            try {
                Files.move(temporaire, destination, StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temporaire, destination, StandardCopyOption.REPLACE_EXISTING);
            }
        } finally {
            Files.deleteIfExists(temporaire);
        }
    }

    @Override
    public Optional<Resource> lire(String cle) {
        try {
            Path fichier = chemin(cle);
            if (!Files.isRegularFile(fichier) || !Files.isReadable(fichier)) return Optional.empty();
            return Optional.of(new FileSystemResource(fichier));
        } catch (IOException e) {
            return Optional.empty();
        }
    }

    @Override
    public void supprimer(String cle) throws IOException {
        Files.deleteIfExists(chemin(cle));
    }

    private Path chemin(String cle) throws IOException {
        if (cle == null || !cle.matches(MOTIF_CLE)) throw new IOException("Clé de stockage invalide.");
        Path chemin = racine.resolve(cle).normalize();
        if (!chemin.startsWith(racine)) throw new IOException("Chemin de stockage invalide.");
        return chemin;
    }
}
