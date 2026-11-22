package ept.edu.sn.alumni_backend.stage.exception;

/** Action impossible dans l'état actuel d'une offre ou d'un stage (déjà publiée, déjà retirée…). */
public class ConflitStageException extends RuntimeException {
    public ConflitStageException(String message) {
        super(message);
    }
}
