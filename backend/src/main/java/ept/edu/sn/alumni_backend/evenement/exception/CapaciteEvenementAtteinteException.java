package ept.edu.sn.alumni_backend.evenement.exception;

public class CapaciteEvenementAtteinteException extends RuntimeException {
    public CapaciteEvenementAtteinteException() {
        super("Cet événement a atteint sa capacité maximale.");
    }

    public CapaciteEvenementAtteinteException(String message) {
        super(message);
    }
}
