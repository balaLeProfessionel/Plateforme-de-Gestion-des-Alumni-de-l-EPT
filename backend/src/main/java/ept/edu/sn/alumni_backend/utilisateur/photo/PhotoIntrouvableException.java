package ept.edu.sn.alumni_backend.utilisateur.photo;

public class PhotoIntrouvableException extends RuntimeException {
    public PhotoIntrouvableException() {
        super("Photo introuvable.");
    }
}
