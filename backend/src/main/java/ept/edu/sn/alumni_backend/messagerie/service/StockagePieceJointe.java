package ept.edu.sn.alumni_backend.messagerie.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;

import ept.edu.sn.alumni_backend.messagerie.TypePieceJointe;
import ept.edu.sn.alumni_backend.messagerie.entity.PieceJointe;
import ept.edu.sn.alumni_backend.messagerie.exception.MessagerieIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoException;

/**
 * Pièces jointes des messages, sur le disque du serveur (même volume que les photos, dossier
 * {@code messagerie}). Le fichier est enregistré sous un identifiant aléatoire, sans extension ;
 * son nom d'origine reste en base. Aucune URL publique : {@code MessageService} vérifie l'accès.
 */
@Service
public class StockagePieceJointe {
    static final String TYPES_ACCEPTES = "image (JPEG, PNG, GIF, WebP), PDF, Word, Excel, PowerPoint ou texte";

    private final Path repertoire;
    private final long tailleMax;
    private final String libelleTailleMax;

    public StockagePieceJointe(@Value("${app.storage.photos.dir:./data/photos}") String repertoire,
            @Value("${app.messagerie.piece-jointe.max-size:10MB}") DataSize tailleMax) {
        this.repertoire = Path.of(repertoire).toAbsolutePath().normalize().resolve("messagerie");
        this.tailleMax = tailleMax.toBytes();
        this.libelleTailleMax = tailleMax.toMegabytes() + " Mo";
    }

    public PieceJointe stocker(MultipartFile fichier) {
        if (fichier.isEmpty()) throw new IllegalArgumentException("Le fichier joint est vide.");
        if (fichier.getSize() > tailleMax) {
            throw new IllegalArgumentException("Le fichier joint ne doit pas dépasser " + libelleTailleMax + ".");
        }
        String nom = nettoyerNom(fichier.getOriginalFilename());
        TypePieceJointe type = TypePieceJointe.depuisNom(nom).orElseThrow(() ->
            new IllegalArgumentException("Ce type de fichier n’est pas accepté : " + TYPES_ACCEPTES + "."));
        Path destination = null;
        try {
            byte[] octets = fichier.getBytes();
            if (!type.contenuConforme(octets)) {
                throw new IllegalArgumentException("Le contenu du fichier ne correspond pas à son extension.");
            }
            Files.createDirectories(repertoire);
            String identifiant = UUID.randomUUID().toString();
            destination = repertoire.resolve(identifiant);
            Files.write(destination, octets);
            return new PieceJointe(identifiant, nom, type.typeMime(), (long) octets.length);
        } catch (IOException e) {
            supprimerSansEchec(destination);
            throw new StockagePhotoException("Impossible d’enregistrer le fichier joint.", e);
        }
    }

    public Resource lire(String identifiant) {
        try {
            Resource fichier = new UrlResource(chemin(identifiant).toUri());
            if (!fichier.exists() || !fichier.isReadable()) throw new MessagerieIntrouvableException("Ce fichier est introuvable.");
            return fichier;
        } catch (IOException | IllegalArgumentException e) {
            throw new MessagerieIntrouvableException("Ce fichier est introuvable.");
        }
    }

    /** Appelé après commit ou après une annulation : un échec de suppression ne doit rien casser. */
    public void supprimer(String identifiant) {
        try {
            supprimerSansEchec(chemin(identifiant));
        } catch (IllegalArgumentException ignore) {
            // identifiant invalide : rien sur le disque
        }
    }

    private Path chemin(String identifiant) {
        return repertoire.resolve(UUID.fromString(identifiant).toString());
    }

    private static void supprimerSansEchec(Path chemin) {
        if (chemin == null) return;
        try {
            Files.deleteIfExists(chemin);
        } catch (IOException ignore) {
            // fichier orphelin : sans conséquence pour le membre
        }
    }

    /** Garde le dernier segment du nom (sans chemin), sans caractère de contrôle, borné à 255 caractères. */
    static String nettoyerNom(String original) {
        String nom = original == null ? "" : original;
        nom = nom.substring(Math.max(nom.lastIndexOf('/'), nom.lastIndexOf('\\')) + 1);
        nom = nom.replaceAll("[\\p{Cntrl}\"]", "").strip();
        if (nom.length() > PieceJointe.LONGUEUR_MAX_NOM) {
            int point = nom.lastIndexOf('.');
            String extension = point > 0 && nom.length() - point <= 10 ? nom.substring(point) : "";
            nom = nom.substring(0, PieceJointe.LONGUEUR_MAX_NOM - extension.length()) + extension;
        }
        return nom.isEmpty() ? "fichier" : nom;
    }
}
