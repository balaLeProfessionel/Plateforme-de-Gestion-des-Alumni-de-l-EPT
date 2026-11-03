package ept.edu.sn.alumni_backend.publication.exception;

public class SignalementIntrouvableException extends RuntimeException {
    public SignalementIntrouvableException() {
        super("Ce signalement n'existe pas.");
    }
}
