package ept.edu.sn.alumni_backend.stage.exception;

public class OffreStageIntrouvableException extends RuntimeException {
    public OffreStageIntrouvableException() {
        super("Offre de stage introuvable");
    }
}
