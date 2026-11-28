package ept.edu.sn.alumni_backend.emploi.exception;

/** Offre inexistante, ou que le lecteur n'a pas le droit de voir : 404 dans les deux cas. */
public class OffreEmploiIntrouvableException extends RuntimeException {
    public OffreEmploiIntrouvableException() {
        super("Cette offre d'emploi est introuvable.");
    }
}
