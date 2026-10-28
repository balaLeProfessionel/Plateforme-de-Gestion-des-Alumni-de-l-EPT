package ept.edu.sn.alumni_backend.auth.exception;

public class RoleNonAutoriseException extends RuntimeException {
    public RoleNonAutoriseException(String message) {
        super(message);
    }
}