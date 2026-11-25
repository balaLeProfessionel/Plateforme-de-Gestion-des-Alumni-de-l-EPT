package ept.edu.sn.alumni_backend.cv.exception;

/** Aucun fournisseur d'IA configuré : 503. */
public class ImportCvIndisponibleException extends RuntimeException {
    public ImportCvIndisponibleException() {
        super("L'import de CV n'est pas disponible pour le moment : remplissez votre profil à la main.");
    }
}
