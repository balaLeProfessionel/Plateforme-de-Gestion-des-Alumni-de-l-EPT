package ept.edu.sn.alumni_backend.cv.lecture;

/** Fichier refusé (format, taille, contenu illisible) : 400, avec un message destiné au membre. */
public class FichierCvInvalideException extends IllegalArgumentException {
    public FichierCvInvalideException(String message) {
        super(message);
    }
}
