package ept.edu.sn.alumni_backend.evenement.exception;

public class ImageEvenementIntrouvableException extends RuntimeException {
    public ImageEvenementIntrouvableException() {
        super("Image d’événement introuvable.");
    }
}
