package ept.edu.sn.alumni_backend.auth.google;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

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
    void desClesLentesAArriverNeSontPasPrisesPourGoogleInjoignable() throws Exception {
        // Serveur de clés qui répond en 1,5 s, comme Google sur une connexion lente
        HttpServer serveur = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        serveur.createContext("/certs", echange -> {
            try {
                Thread.sleep(1500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            byte[] corps = "{\"keys\":[]}".getBytes(StandardCharsets.UTF_8);
            echange.getResponseHeaders().add("Content-Type", "application/json");
            echange.sendResponseHeaders(200, corps.length);
            echange.getResponseBody().write(corps);
            echange.close();
        });
        serveur.start();
        try {
            var verificateur = new VerificateurJetonGoogleNimbus("client-test",
                "http://127.0.0.1:" + serveur.getAddress().getPort() + "/certs");

            // Les clés arrivent : le jeton est refusé pour sa signature, pas pour un délai dépassé
            assertThatThrownBy(() -> verificateur.verifier(JETON_BIEN_FORME))
                .isInstanceOf(JetonGoogleInvalideException.class);
        } finally {
            serveur.stop(0);
        }
    }

    @Test
    void unJetonIllisibleResteUnJetonInvalide() {
        var verificateur = new VerificateurJetonGoogleNimbus("client-test", "http://127.0.0.1:1/certs");

        assertThatThrownBy(() -> verificateur.verifier("pas-un-jeton"))
            .isInstanceOf(JetonGoogleInvalideException.class);
    }
}
