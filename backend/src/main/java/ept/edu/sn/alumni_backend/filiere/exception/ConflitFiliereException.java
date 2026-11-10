package ept.edu.sn.alumni_backend.filiere.exception;

/** Opération impossible sur une filière dans son état actuel (nom déjà pris, déjà retirée, même chef…). */
public class ConflitFiliereException extends RuntimeException {
    public ConflitFiliereException(String message) {
        super(message);
    }
}
