package ept.edu.sn.alumni_backend.auth.exception;

public class TokenInvalideException extends RuntimeException {
    public TokenInvalideException(String message) {
        super(message);
    }
}