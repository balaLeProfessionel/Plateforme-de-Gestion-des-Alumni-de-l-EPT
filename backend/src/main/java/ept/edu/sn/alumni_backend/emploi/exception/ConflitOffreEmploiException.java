package ept.edu.sn.alumni_backend.emploi.exception;

/** Action impossible dans l'état actuel d'une offre (déjà retirée, déjà signalée…). */
public class ConflitOffreEmploiException extends RuntimeException {
    public ConflitOffreEmploiException(String message) {
        super(message);
    }
}
