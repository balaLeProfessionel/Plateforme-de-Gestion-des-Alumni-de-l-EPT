package ept.edu.sn.alumni_backend.auth.google;

/**
 * Vérifie un jeton d'identité émis par Google Identity Services (signature, émetteur,
 * audience, expiration). Isolé derrière une interface pour que les tests n'appellent pas Google.
 */
public interface VerificateurJetonGoogle {

    /** @throws JetonGoogleInvalideException si le jeton n'est pas un jeton Google valide pour cette application. */
    IdentiteGoogle verifier(String jeton);
}
