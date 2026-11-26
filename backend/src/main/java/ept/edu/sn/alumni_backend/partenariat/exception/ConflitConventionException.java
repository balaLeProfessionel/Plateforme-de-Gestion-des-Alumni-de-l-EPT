package ept.edu.sn.alumni_backend.partenariat.exception;

/** État incompatible avec l'opération (demande déjà en cours, transition interdite, limite de pièces) : 409. */
public class ConflitConventionException extends RuntimeException {
    public ConflitConventionException(String message) {
        super(message);
    }
}
