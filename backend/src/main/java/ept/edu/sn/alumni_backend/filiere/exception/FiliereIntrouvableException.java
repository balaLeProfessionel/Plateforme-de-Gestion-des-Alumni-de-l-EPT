package ept.edu.sn.alumni_backend.filiere.exception;

public class FiliereIntrouvableException extends RuntimeException {
    public FiliereIntrouvableException() {
        super("Filière introuvable");
    }
}
