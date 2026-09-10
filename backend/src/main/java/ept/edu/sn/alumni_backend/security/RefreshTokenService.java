package ept.edu.sn.alumni_backend.security;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import ept.edu.sn.alumni_backend.auth.exception.TokenInvalideException;
import ept.edu.sn.alumni_backend.utilisateur.Utilisateur;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    private static final SecureRandom RANDOM = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                                PasswordEncoder passwordEncoder) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Crée un refresh token pour un utilisateur et renvoie la valeur EN CLAIR
     * à donner au client, sous la forme "<idLigne>.<secret>".
     * Seul le hash du secret est stocké en base.
     */
    public String creerRefreshToken(Utilisateur utilisateur) {
        String secret = genererSecret();
        String secretHash = passwordEncoder.encode(secret);

        RefreshToken token = new RefreshToken(
            secretHash,
            LocalDateTime.now().plusSeconds(refreshExpirationMs / 1000),
            utilisateur
        );
        token = refreshTokenRepository.save(token);

        // On renvoie l'id de la ligne + le secret, séparés par un point
        return token.getId() + "." + secret;
    }

    /**
     * Vérifie un refresh token reçu du client et renvoie l'utilisateur associé
     * si le token est valide et non expiré. Sinon lève une exception.
     */
    public Utilisateur verifierEtObtenirUtilisateur(String refreshTokenComplet) {
        String[] parties = refreshTokenComplet.split("\\.", 2);
        if (parties.length != 2) {
            throw new TokenInvalideException("Refresh token invalide");
        }

        UUID id;
        try {
            id = UUID.fromString(parties[0]);
        } catch (IllegalArgumentException e) {
            throw new TokenInvalideException("Refresh token invalide");
        }
        String secret = parties[1];

        RefreshToken token = refreshTokenRepository.findById(id)
            .orElseThrow(() -> new TokenInvalideException("Refresh token invalide ou expiré"));

        if (token.estExpire()) {
            refreshTokenRepository.delete(token);
            throw new TokenInvalideException("Session expirée, reconnectez-vous");
        }

        if (!passwordEncoder.matches(secret, token.getSecretHash())) {
            throw new TokenInvalideException("Refresh token invalide");
        }

        return token.getUtilisateur();
    }

    /**
     * Supprime un refresh token précis (déconnexion de l'appareil courant).
     */
    public void supprimerRefreshToken(String refreshTokenComplet) {
        String[] parties = refreshTokenComplet.split("\\.", 2);
        if (parties.length != 2) {
            return; // rien à supprimer si le format est invalide
        }
        try {
            UUID id = UUID.fromString(parties[0]);
            refreshTokenRepository.findById(id).ifPresent(token -> {
                if (passwordEncoder.matches(parties[1], token.getSecretHash())) {
                    refreshTokenRepository.delete(token);
                }
            });
        } catch (IllegalArgumentException e) {
            // id invalide, rien à faire
        }
    }

    private String genererSecret() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
