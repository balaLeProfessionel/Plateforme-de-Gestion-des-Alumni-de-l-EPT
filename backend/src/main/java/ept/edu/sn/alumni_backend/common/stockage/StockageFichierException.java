package ept.edu.sn.alumni_backend.common.stockage;

/** Erreur d'écriture ou de suppression sur le disque : ce n'est pas la faute de l'utilisateur (500). */
public class StockageFichierException extends RuntimeException {
    public StockageFichierException(String message, Throwable cause) {
        super(message, cause);
    }
}
