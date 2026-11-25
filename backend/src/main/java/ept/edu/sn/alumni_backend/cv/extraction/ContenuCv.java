package ept.edu.sn.alumni_backend.cv.extraction;

import java.util.List;

import ept.edu.sn.alumni_backend.cv.TypeSourceCv;

/**
 * Ce qui part vers l'IA : soit le texte lu localement, soit des images JPEG réencodées (sans métadonnées).
 * Le fichier d'origine n'est jamais transmis tel quel.
 */
public record ContenuCv(TypeSourceCv type, String texte, List<byte[]> imagesJpeg) {
    public static ContenuCv texte(String texte) {
        return new ContenuCv(TypeSourceCv.TEXTE, texte, List.of());
    }

    public static ContenuCv images(List<byte[]> imagesJpeg) {
        return new ContenuCv(TypeSourceCv.IMAGES, null, List.copyOf(imagesJpeg));
    }
}
