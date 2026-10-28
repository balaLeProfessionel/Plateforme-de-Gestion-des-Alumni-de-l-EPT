package ept.edu.sn.alumni_backend.mentorat.exception;

/** Action impossible dans l'état actuel du mentorat (mentor complet, statut déjà changé…). */
public class ConflitMentoratException extends RuntimeException {
    public ConflitMentoratException(String message) {
        super(message);
    }
}
