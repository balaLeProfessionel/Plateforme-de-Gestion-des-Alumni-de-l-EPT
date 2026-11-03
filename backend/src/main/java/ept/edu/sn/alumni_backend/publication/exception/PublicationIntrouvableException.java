package ept.edu.sn.alumni_backend.publication.exception;

public class PublicationIntrouvableException extends RuntimeException {
    public PublicationIntrouvableException() {
        super("Cette publication n'est pas disponible.");
    }
}
