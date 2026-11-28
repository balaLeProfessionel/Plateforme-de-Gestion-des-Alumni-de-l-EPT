package ept.edu.sn.alumni_backend.partenariat.exception;

/** Convention inexistante ou appartenant à un autre organisme : 404, pour ne pas révéler son existence. */
public class ConventionIntrouvableException extends RuntimeException {
    public ConventionIntrouvableException() {
        super("Convention de partenariat introuvable.");
    }
}
