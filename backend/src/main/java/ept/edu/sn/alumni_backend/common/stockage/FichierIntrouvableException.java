package ept.edu.sn.alumni_backend.common.stockage;

public class FichierIntrouvableException extends RuntimeException {
    public FichierIntrouvableException() {
        super("Fichier introuvable");
    }
}
