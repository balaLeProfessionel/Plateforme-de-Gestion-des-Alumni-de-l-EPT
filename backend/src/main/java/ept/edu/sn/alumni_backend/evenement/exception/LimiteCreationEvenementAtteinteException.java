package ept.edu.sn.alumni_backend.evenement.exception;

public class LimiteCreationEvenementAtteinteException extends RuntimeException {
    public LimiteCreationEvenementAtteinteException() {
        super("La limite de créations d’événements sur 24 heures est atteinte.");
    }
}
