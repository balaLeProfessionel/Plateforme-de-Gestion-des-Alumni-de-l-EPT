package ept.edu.sn.alumni_backend.admin.exception;

/** Action d'administration impossible dans l'état actuel du compte (déjà validé, dernier admin…). */
public class ConflitCompteException extends RuntimeException {
    public ConflitCompteException(String message) {
        super(message);
    }
}
