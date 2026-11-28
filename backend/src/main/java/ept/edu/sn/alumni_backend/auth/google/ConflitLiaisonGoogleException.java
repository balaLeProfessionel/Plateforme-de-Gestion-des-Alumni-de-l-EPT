package ept.edu.sn.alumni_backend.auth.google;

/**
 * Liaison avec Google impossible dans l'état du compte : compte Google déjà lié à un autre compte,
 * compte lié à un autre compte Google, Google désactivé pour cette adresse, ou aucun mot de passe connu
 * pour délier. Le message explique quoi faire.
 */
public class ConflitLiaisonGoogleException extends RuntimeException {
    private final String code;

    public ConflitLiaisonGoogleException(String code, String message) {
        super(message);
        this.code = code;
    }

    public String code() {
        return code;
    }
}
