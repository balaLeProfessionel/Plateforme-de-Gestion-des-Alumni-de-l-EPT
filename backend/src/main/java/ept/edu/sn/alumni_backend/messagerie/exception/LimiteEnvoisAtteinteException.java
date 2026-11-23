package ept.edu.sn.alumni_backend.messagerie.exception;

/** Trop de messages envoyés en une minute : la réponse est un 429. */
public class LimiteEnvoisAtteinteException extends RuntimeException {
    public LimiteEnvoisAtteinteException() {
        super("Vous envoyez des messages trop vite. Patientez un instant avant de réessayer.");
    }
}
