package ept.edu.sn.alumni_backend.mobilite.exception;

public class OffreMobiliteIntrouvableException extends RuntimeException {
    public OffreMobiliteIntrouvableException() {
        super("Offre de mobilité introuvable.");
    }
}
