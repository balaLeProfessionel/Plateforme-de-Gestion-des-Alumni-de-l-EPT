package ept.edu.sn.alumni_backend.cv.exception;

/** Import déjà en cours, limite quotidienne atteinte ou import qui n'est plus à relire : 409. */
public class ConflitImportCvException extends RuntimeException {
    public ConflitImportCvException(String message) {
        super(message);
    }
}
