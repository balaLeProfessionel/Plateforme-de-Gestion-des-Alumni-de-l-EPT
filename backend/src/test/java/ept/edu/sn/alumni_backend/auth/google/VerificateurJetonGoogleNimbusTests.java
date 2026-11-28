package ept.edu.sn.alumni_backend.auth.google;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.jupiter.api.Test;

class VerificateurJetonGoogleNimbusTests {

    private static String base64(String texte) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(texte.getBytes(StandardCharsets.UTF_8));
    }

    /** Jeton bien formé : sa vérification oblige à télécharger les clés de Google. */
    private static final String JETON_BIEN_FORME = base64("{\"alg\":\"RS256\",\"kid\":\"cle-test\",\"typ\":\"JWT\"}")
        + "." + base64("{\"iss\":\"https://accounts.google.com\",\"aud\":\"client-test\",\"email\":\"a@exemple.invalid\"}")
        + "." + base64("signature");

    @Test
    void googleInjoignableEstSignaleCommeIndisponibleEtNonCommeJetonInvalide() {
        // Port 1 : connexion refusée tout de suite, comme un réseau coupé
        var verificateur = new VerificateurJetonGoogleNimbus("client-test", "http://127.0.0.1:1/certs");

        assertThatThrownBy(() -> verificateur.verifier(JETON_BIEN_FORME))
            .isInstanceOf(ConnexionGoogleIndisponibleException.class)
            .hasMessageContaining("Google ne répond pas");
    }

    @Test
    void unJetonIllisibleResteUnJetonInvalide() {
        var verificateur = new VerificateurJetonGoogleNimbus("client-test", "http://127.0.0.1:1/certs");

        assertThatThrownBy(() -> verificateur.verifier("pas-un-jeton"))
            .isInstanceOf(JetonGoogleInvalideException.class);
    }
}
