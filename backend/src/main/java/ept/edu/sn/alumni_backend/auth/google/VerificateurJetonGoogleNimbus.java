package ept.edu.sn.alumni_backend.auth.google;

import java.util.List;
import java.util.Set;

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

/**
 * Vérification locale d'un jeton d'identité Google : clés publiques de Google (mises en cache
 * par Nimbus), émetteur {@code accounts.google.com}, audience égale à notre identifiant client
 * et date d'expiration. Aucun secret n'est nécessaire.
 */
@Component
public class VerificateurJetonGoogleNimbus implements VerificateurJetonGoogle {

    private static final String CLES_GOOGLE = "https://www.googleapis.com/oauth2/v3/certs";
    private static final Set<String> EMETTEURS = Set.of("accounts.google.com", "https://accounts.google.com");

    private final String clientId;
    private volatile JwtDecoder decodeur;

    public VerificateurJetonGoogleNimbus(@Value("${app.google.client-id:}") String clientId) {
        this.clientId = clientId == null ? "" : clientId.trim();
    }

    @Override
    public IdentiteGoogle verifier(String jeton) {
        Jwt jwt;
        try {
            jwt = decodeur().decode(jeton);
        } catch (JwtException e) {
            throw new JetonGoogleInvalideException("La connexion Google a échoué. Réessayez.");
        }
        return new IdentiteGoogle(jwt.getClaimAsString("email"), Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
            jwt.getClaimAsString("given_name"), jwt.getClaimAsString("family_name"));
    }

    private JwtDecoder decodeur() {
        JwtDecoder existant = decodeur;
        if (existant != null) {
            return existant;
        }
        synchronized (this) {
            if (decodeur == null) {
                NimbusJwtDecoder nimbus = NimbusJwtDecoder.withJwkSetUri(CLES_GOOGLE).build();
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
