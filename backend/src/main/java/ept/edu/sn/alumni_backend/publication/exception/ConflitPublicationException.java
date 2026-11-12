package ept.edu.sn.alumni_backend.publication.exception;

/** Action incompatible avec l'état d'une publication ou d'un signalement (doublon, décision déjà prise). */
public class ConflitPublicationException extends RuntimeException {
    public ConflitPublicationException(String message) {
        super(message);
    }
}
