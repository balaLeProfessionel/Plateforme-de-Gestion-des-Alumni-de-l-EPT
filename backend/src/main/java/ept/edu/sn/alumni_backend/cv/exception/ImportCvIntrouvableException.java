package ept.edu.sn.alumni_backend.cv.exception;

public class ImportCvIntrouvableException extends RuntimeException {
    public ImportCvIntrouvableException() {
        super("Import de CV introuvable.");
    }
}
