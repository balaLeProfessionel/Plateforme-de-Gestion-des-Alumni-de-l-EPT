package ept.edu.sn.alumni_backend.apercu;

/** Adresse non valide ou pointant vers le réseau interne ; renvoyée en 400 avec son message. */
public class LienRefuseException extends IllegalArgumentException {
    public LienRefuseException(String message) {
        super(message);
    }
}
