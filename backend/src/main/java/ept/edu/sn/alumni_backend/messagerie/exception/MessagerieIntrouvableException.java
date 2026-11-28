package ept.edu.sn.alumni_backend.messagerie.exception;

/** Conversation, message ou membre introuvable, ou conversation dont on ne fait pas partie : 404. */
public class MessagerieIntrouvableException extends RuntimeException {
    public MessagerieIntrouvableException(String message) {
        super(message);
    }
}
