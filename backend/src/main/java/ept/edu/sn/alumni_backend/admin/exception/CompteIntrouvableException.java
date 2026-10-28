package ept.edu.sn.alumni_backend.admin.exception;

public class CompteIntrouvableException extends RuntimeException {
    public CompteIntrouvableException() {
        super("Compte introuvable");
    }
}
