package ept.edu.sn.alumni_backend.messagerie;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

/**
 * Fichiers acceptés en pièce jointe. Un fichier n'est reconnu que si son extension ET le début
 * de son contenu concordent : le type annoncé par le navigateur n'est jamais cru. Pas de SVG ni
 * de HTML (ils peuvent porter du script), pas d'anciens formats Office (.doc, .xls, .ppt).
 */
public enum TypePieceJointe {
    JPEG("image/jpeg", true, Set.of("jpg", "jpeg")),
    PNG("image/png", true, Set.of("png")),
    GIF("image/gif", true, Set.of("gif")),
    WEBP("image/webp", true, Set.of("webp")),
    PDF("application/pdf", false, Set.of("pdf")),
    WORD("application/vnd.openxmlformats-officedocument.wordprocessingml.document", false, Set.of("docx")),
    EXCEL("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", false, Set.of("xlsx")),
    POWERPOINT("application/vnd.openxmlformats-officedocument.presentationml.presentation", false, Set.of("pptx")),
    TEXTE("text/plain", false, Set.of("txt"));

    private final String typeMime;
    private final boolean image;
    private final Set<String> extensions;

    TypePieceJointe(String typeMime, boolean image, Set<String> extensions) {
        this.typeMime = typeMime;
        this.image = image;
        this.extensions = extensions;
    }

    public String typeMime() {
        return typeMime;
    }

    /** Une image s'affiche dans le fil ; les autres fichiers se téléchargent. */
    public boolean image() {
        return image;
    }

    public static Optional<TypePieceJointe> depuisNom(String nomFichier) {
        int point = nomFichier.lastIndexOf('.');
        if (point < 0) return Optional.empty();
        String extension = nomFichier.substring(point + 1).toLowerCase(Locale.ROOT);
        return Arrays.stream(values()).filter(type -> type.extensions.contains(extension)).findFirst();
    }

    public static Optional<TypePieceJointe> depuisTypeMime(String typeMime) {
        return Arrays.stream(values()).filter(type -> type.typeMime.equals(typeMime)).findFirst();
    }

    /** Le contenu commence-t-il comme un fichier de ce type ? */
    public boolean contenuConforme(byte[] octets) {
        return switch (this) {
            case JPEG -> commencePar(octets, 0, 0xFF, 0xD8, 0xFF);
            case PNG -> commencePar(octets, 0, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A);
            case GIF -> commencePar(octets, 0, 'G', 'I', 'F', '8');
            case WEBP -> commencePar(octets, 0, 'R', 'I', 'F', 'F') && commencePar(octets, 8, 'W', 'E', 'B', 'P');
            case PDF -> commencePar(octets, 0, '%', 'P', 'D', 'F', '-');
            // Les formats Office récents sont des archives ZIP.
            case WORD, EXCEL, POWERPOINT -> commencePar(octets, 0, 'P', 'K', 0x03, 0x04);
            case TEXTE -> texteValide(octets);
        };
    }

    private static boolean commencePar(byte[] octets, int depart, int... attendus) {
        if (octets.length < depart + attendus.length) return false;
        for (int i = 0; i < attendus.length; i++) {
            if ((octets[depart + i] & 0xFF) != attendus[i]) return false;
        }
        return true;
    }

    /** Texte UTF-8 sans octet nul : un fichier binaire renommé en .txt est refusé. */
    private static boolean texteValide(byte[] octets) {
        for (byte octet : octets) {
            if (octet == 0) return false;
        }
        try {
            StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(octets));
            return true;
        } catch (java.nio.charset.CharacterCodingException e) {
            return false;
        }
    }
}
