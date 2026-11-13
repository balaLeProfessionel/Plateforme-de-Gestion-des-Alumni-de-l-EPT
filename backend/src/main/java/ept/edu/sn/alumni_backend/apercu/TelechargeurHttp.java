package ept.edu.sn.alumni_backend.apercu;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Set;
import java.util.function.Predicate;

import org.springframework.stereotype.Component;

/**
 * Client HTTP qui suit lui-même au plus trois redirections, en revérifiant l'adresse à chaque saut, et qui
 * s'annonce honnêtement : pas d'agent de navigateur ni de robot d'indexation emprunté.
 */
@Component
public class TelechargeurHttp implements Telechargeur {
    static final String AGENT = "EPT-Alumni-Apercu/1.0 (apercu de lien partage par un membre)";
    private static final Set<Integer> REDIRECTIONS = Set.of(301, 302, 303, 307, 308);
    private static final int SAUTS_MAX = 3;
    private static final Duration DELAI = Duration.ofSeconds(5);

    private final HttpClient client = HttpClient.newBuilder()
        .followRedirects(HttpClient.Redirect.NEVER)
        .connectTimeout(DELAI)
        .build();

    @Override
    public Ressource lire(URI adresse, long poidsMax, Predicate<String> typeAccepte, boolean tronquer) throws IOException {
        URI courante = adresse;
        for (int saut = 0; saut <= SAUTS_MAX; saut++) {
            GardeAdresse.verifierPublique(courante);
            HttpRequest requete = HttpRequest.newBuilder(courante).timeout(DELAI)
                .header("User-Agent", AGENT)
                .header("Accept", "text/html,application/xhtml+xml,image/jpeg,image/png;q=0.9,*/*;q=0.5")
                .header("Accept-Language", "fr,en;q=0.8")
                .GET().build();
            HttpResponse<InputStream> reponse;
            try {
                reponse = client.send(requete, HttpResponse.BodyHandlers.ofInputStream());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("Lecture interrompue", e);
            }
            try (InputStream corps = reponse.body()) {
                int statut = reponse.statusCode();
                if (REDIRECTIONS.contains(statut)) {
                    String destination = reponse.headers().firstValue("Location").orElse(null);
                    if (destination == null) return null;
                    courante = GardeAdresse.normaliser(courante.resolve(destination.strip()).toString());
                    continue;
                }
                String type = reponse.headers().firstValue("Content-Type").orElse("");
                if (statut != 200 || !typeAccepte.test(type)) return null;
                byte[] contenu = corps.readNBytes((int) poidsMax + 1);
                if (contenu.length > poidsMax) {
                    if (!tronquer) return null;
                    contenu = java.util.Arrays.copyOf(contenu, (int) poidsMax);
                }
                return new Ressource(courante, type, contenu);
            }
        }
        return null;
    }
}
