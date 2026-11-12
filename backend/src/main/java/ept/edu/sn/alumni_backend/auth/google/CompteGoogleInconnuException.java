package ept.edu.sn.alumni_backend.auth.google;

/** Aucun compte n'utilise l'adresse du compte Google : il faut d'abord s'inscrire. */
public class CompteGoogleInconnuException extends RuntimeException {
    public CompteGoogleInconnuException() {
        super("Aucun compte EPT Alumni n'utilise cette adresse Google. Créez d'abord votre compte.");
    }
}
