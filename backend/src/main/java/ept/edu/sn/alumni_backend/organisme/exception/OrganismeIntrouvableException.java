package ept.edu.sn.alumni_backend.organisme.exception;

public class OrganismeIntrouvableException extends RuntimeException {
    public OrganismeIntrouvableException() {
        super("Cet organisme n'est pas disponible.");
    }
}
