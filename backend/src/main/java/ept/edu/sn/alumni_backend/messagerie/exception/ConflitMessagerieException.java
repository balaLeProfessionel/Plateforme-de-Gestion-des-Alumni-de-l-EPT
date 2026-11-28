package ept.edu.sn.alumni_backend.messagerie.exception;

/** Action incompatible avec la conversation (par exemple quitter une conversation directe) : 409. */
public class ConflitMessagerieException extends RuntimeException {
    public ConflitMessagerieException(String message) {
        super(message);
    }
}
