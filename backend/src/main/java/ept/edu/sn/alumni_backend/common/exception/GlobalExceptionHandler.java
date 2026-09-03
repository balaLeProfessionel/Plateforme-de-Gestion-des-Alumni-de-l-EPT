package ept.edu.sn.alumni_backend.common.exception;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import ept.edu.sn.alumni_backend.auth.exception.EmailDejaUtiliseException;
import ept.edu.sn.alumni_backend.auth.exception.NomOrganismeManquantException;
import ept.edu.sn.alumni_backend.auth.exception.RoleNonAutoriseException;
import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Email ou mot de passe incorrect"));
    }

    @ExceptionHandler(EmailDejaUtiliseException.class)
    public ResponseEntity<Map<String, String>> handleEmailDejaUtilise(EmailDejaUtiliseException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(RoleNonAutoriseException.class)
    public ResponseEntity<Map<String, String>> handleRoleNonAutorise(RoleNonAutoriseException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> erreurs = new HashMap<>();
        e.getBindingResult().getFieldErrors()
            .forEach(err -> erreurs.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.badRequest().body(erreurs);
    }

    @ExceptionHandler(TokenInvalideException.class)
    public ResponseEntity<Map<String, String>> handleTokenInvalide(TokenInvalideException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<Map<String, String>> handleDisabled() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message",
                    "Compte non activé. Vérifiez votre email, ou contactez l'administration si votre compte a été suspendu."));
    }

    @ExceptionHandler(LockedException.class)
    public ResponseEntity<Map<String, String>> handleLocked() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Votre compte a été suspendu. Contactez l'administration."));
    }

    @ExceptionHandler(NomOrganismeManquantException.class)
    public ResponseEntity<Map<String, String>> handleNomOrganismeManquant(NomOrganismeManquantException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurity(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("message", e.getMessage()));
    }
}