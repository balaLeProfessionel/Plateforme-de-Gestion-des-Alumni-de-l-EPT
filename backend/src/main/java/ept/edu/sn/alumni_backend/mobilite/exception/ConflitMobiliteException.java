package ept.edu.sn.alumni_backend.mobilite.exception;

/** État incompatible avec l'opération demandée (offre retirée, limite de pièces atteinte…) : 409. */
public class ConflitMobiliteException extends RuntimeException {
    public ConflitMobiliteException(String message) {
        super(message);
    }
}
