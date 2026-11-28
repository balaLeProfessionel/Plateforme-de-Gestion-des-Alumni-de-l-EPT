package ept.edu.sn.alumni_backend.auth.google;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;

/**
 * Vérification locale d'un jeton d'identité Google : clés publiques de Google (mises en cache
 * par Nimbus), émetteur {@code accounts.google.com}, audience égale à notre identifiant client
 * et date d'expiration. Aucun secret n'est nécessaire.
 */
@Component
public class VerificateurJetonGoogleNimbus implements VerificateurJetonGoogle {

    private static final Logger LOGGER = LoggerFactory.getLogger(VerificateurJetonGoogleNimbus.class);
    private static final String CLES_GOOGLE = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> EMETTEURS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final String clientId;
    private final String clesGoogle;
    private volatile JwtDecoder decodeur;

    @Autowired
    public VerificateurJetonGoogleNimbus(@Value("${app.google.client-id:}") String clientId) {
        this(clientId, CLES_GOOGLE);
    }

    /** Adresse des clés remplaçable pour les tests (Google injoignable). */
    VerificateurJetonGoogleNimbus(String clientId, String clesGoogle) {
        this.clientId = clientId == null ? "" : clientId.trim();
        this.clesGoogle = clesGoogle;
    }

    @Override
    public IdentiteGoogle verifier(String jeton) {
        Jwt jwt;
        try {
            jwt = decodeur().decode(jeton);
        } catch (JwtException e) {
            // Raison technique (expiré, audience, émetteur, clés de Google injoignables…) : jamais le jeton lui-même
            LOGGER.warn("Jeton Google refusé : {}", e.getMessage());
            if (googleInjoignable(e)) {
                // Le jeton n'y est pour rien : la personne peut simplement réessayer
                throw new ConnexionGoogleIndisponibleException(
                    "Google ne répond pas pour le moment. Réessayez dans un instant.");
            }
            throw new JetonGoogleInvalideException("La connexion Google a échoué. Réessayez.");
        }
        return new IdentiteGoogle(jwt.getClaimAsString("email"), Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
            jwt.getClaimAsString("given_name"), jwt.getClaimAsString("family_name"));
    }

    /** Clés publiques de Google impossibles à télécharger (réseau coupé, délai dépassé). */
    private static boolean googleInjoignable(Throwable erreur) {
        for (Throwable cause = erreur; cause != null; cause = cause.getCause()) {
            if (cause instanceof IOException || cause instanceof ResourceAccessException) {
                return true;
            }
        }
        return false;
    }

    private JwtDecoder decodeur() {
        JwtDecoder existant = decodeur;
        if (existant != null) {
            return existant;
        }
        synchronized (this) {
            if (decodeur == null) {
                NimbusJwtDecoder nimbus = NimbusJwtDecoder.withJwkSetUri(clesGoogle).build();
                OAuth2TokenValidator<Jwt> emetteur = jwt -> EMETTEURS.contains(jwt.getClaimAsString("iss"))
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Émetteur inattendu", null));
                OAuth2TokenValidator<Jwt> audience = jwt -> {
                    List<String> aud = jwt.getAudience();
                    return aud != null && aud.contains(clientId)
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Audience inattendue", null));
                };
                nimbus.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), emetteur, audience));
                decodeur = nimbus;
            }
            return decodeur;
        }
    }
}
