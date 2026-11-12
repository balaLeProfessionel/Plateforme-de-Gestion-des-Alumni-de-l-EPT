package ept.edu.sn.alumni_backend.publication.exception;

public class LimiteCreationPublicationAtteinteException extends RuntimeException {
    public LimiteCreationPublicationAtteinteException() {
        super("La limite de publications sur 24 heures est atteinte.");
    }
}
