package ept.edu.sn.alumni_backend.auth.google;

/**
 * Connexion avec Google impossible pour une raison qui ne tient pas à la personne : aucun identifiant
 * client configuré (variable GOOGLE_CLIENT_ID), ou serveurs de Google injoignables.
 */
public class ConnexionGoogleIndisponibleException extends RuntimeException {
    public ConnexionGoogleIndisponibleException() {
        this("La connexion avec Google n'est pas disponible pour le moment.");
    }

    public ConnexionGoogleIndisponibleException(String message) {
        super(message);
    }
}
