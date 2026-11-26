package ept.edu.sn.alumni_backend.partenariat.exception;

/** Accord inexistant ou appartenant à un autre organisme : 404, pour ne pas révéler son existence. */
public class AccordIntrouvableException extends RuntimeException {
    public AccordIntrouvableException() {
        super("Accord introuvable.");
    }
}
