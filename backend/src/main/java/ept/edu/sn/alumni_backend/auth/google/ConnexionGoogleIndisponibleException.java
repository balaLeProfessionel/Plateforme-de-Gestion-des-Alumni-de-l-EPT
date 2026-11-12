package ept.edu.sn.alumni_backend.auth.google;

/** Aucun identifiant client Google n'est configuré (variable GOOGLE_CLIENT_ID). */
public class ConnexionGoogleIndisponibleException extends RuntimeException {
    public ConnexionGoogleIndisponibleException() {
        super("La connexion avec Google n'est pas disponible pour le moment.");
    }
}
