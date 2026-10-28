package ept.edu.sn.alumni_backend.evenement.exception;

public class EvenementIntrouvableException extends RuntimeException {
    public EvenementIntrouvableException() {
        super("Cet événement est introuvable.");
    }
}
