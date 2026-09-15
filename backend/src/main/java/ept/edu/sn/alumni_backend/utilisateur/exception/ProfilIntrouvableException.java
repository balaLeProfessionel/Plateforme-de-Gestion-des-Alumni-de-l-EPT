package ept.edu.sn.alumni_backend.utilisateur.exception;

public class ProfilIntrouvableException extends RuntimeException {
    public ProfilIntrouvableException() {
        super("Ce profil n'est pas disponible");
    }
}
