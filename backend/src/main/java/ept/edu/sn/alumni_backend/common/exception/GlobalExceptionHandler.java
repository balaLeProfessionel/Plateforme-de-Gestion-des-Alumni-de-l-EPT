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
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import ept.edu.sn.alumni_backend.auth.exception.EmailDejaUtiliseException;
import ept.edu.sn.alumni_backend.auth.exception.NomOrganismeManquantException;
import ept.edu.sn.alumni_backend.auth.exception.RoleNonAutoriseException;
import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;
import ept.edu.sn.alumni_backend.organisme.exception.OrganismeIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.exception.ProfilIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.photo.PhotoIntrouvableException;
import ept.edu.sn.alumni_backend.utilisateur.photo.StockagePhotoException;
import jakarta.validation.ConstraintViolationException;

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

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, String>> handleConstraintViolation(ConstraintViolationException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
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

    @ExceptionHandler(ProfilIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleProfilIntrouvable(ProfilIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(OrganismeIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handleOrganismeIntrouvable(OrganismeIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(PhotoIntrouvableException.class)
    public ResponseEntity<Map<String, String>> handlePhotoIntrouvable(PhotoIntrouvableException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(StockagePhotoException.class)
    public ResponseEntity<Map<String, String>> handleStockagePhoto(StockagePhotoException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handlePhotoTropGrande() {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(Map.of("message", "La photo ne doit pas dépasser 5 Mo."));
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
