package ept.edu.sn.alumni_backend.apercu;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;

import org.apache.hc.client5.http.SystemDefaultDnsResolver;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManagerBuilder;
import org.apache.hc.core5.http.ClassicHttpResponse;
import org.apache.hc.core5.http.Header;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.stereotype.Component;

/**
 * Client HTTP qui suit lui-même au plus trois redirections, en revérifiant l'adresse à chaque saut, et qui
 * s'annonce honnêtement : pas d'agent de navigateur ni de robot d'indexation emprunté.
 *
 * <p>Deux protections tiennent à la connexion elle-même :
 * <ul>
 *   <li>le résolveur DNS du client refuse toute adresse interne : l'adresse contrôlée est celle qui est contactée,
 *       un nom qui change de réponse entre deux résolutions (« DNS rebinding ») ne passe donc pas ;</li>
 *   <li>la lecture entière (redirections comprises) a une échéance : un site qui envoie sa page goutte à goutte
 *       est abandonné au lieu d'occuper un fil du serveur.</li>
 * </ul>
 */
@Component
public class TelechargeurHttp implements Telechargeur, DisposableBean {
    static final String AGENT = "EPT-Alumni-Apercu/1.0 (apercu de lien partage par un membre)";
    private static final Set<Integer> REDIRECTIONS = Set.of(301, 302, 303, 307, 308);
    private static final int SAUTS_MAX = 3;
    private static final Timeout DELAI = Timeout.ofSeconds(5);
    private static final Duration DUREE_MAX = Duration.ofSeconds(10);

    private final CloseableHttpClient client = HttpClients.custom()
        .setConnectionManager(PoolingHttpClientConnectionManagerBuilder.create()
            .setDnsResolver(new ResolveurPublic())
            .setDefaultConnectionConfig(ConnectionConfig.custom().setConnectTimeout(DELAI).setSocketTimeout(DELAI).build())
            .build())
        .setDefaultRequestConfig(RequestConfig.custom().setResponseTimeout(DELAI).build())
        // Pas de connexion réutilisée : fermer une réponse abandonnée ne lit pas le reste du corps.
        .setConnectionReuseStrategy((requete, reponse, contexte) -> false)
        .disableRedirectHandling()
        .disableAutomaticRetries()
        .disableCookieManagement()
        .setUserAgent(AGENT)
        .build();

    @Override
    public Ressource lire(URI adresse, long poidsMax, Predicate<String> typeAccepte, boolean tronquer) throws IOException {
        long echeance = System.nanoTime() + DUREE_MAX.toNanos();
        URI courante = adresse;
        for (int saut = 0; saut <= SAUTS_MAX; saut++) {
            // Message clair pour un lien manifestement interne ; le résolveur, lui, garde la connexion.
            GardeAdresse.verifierPublique(courante);
            exigerAvant(echeance);
            HttpGet requete = new HttpGet(courante);
            requete.setHeader("Accept", "text/html,application/xhtml+xml,image/jpeg,image/png;q=0.9,*/*;q=0.5");
            requete.setHeader("Accept-Language", "fr,en;q=0.8");
            try (ClassicHttpResponse reponse = client.executeOpen(HttpHost.create(courante), requete, null)) {
                int statut = reponse.getCode();
                if (REDIRECTIONS.contains(statut)) {
                    Header destination = reponse.getFirstHeader("Location");
                    requete.cancel();
                    if (destination == null) return null;
                    courante = GardeAdresse.normaliser(courante.resolve(destination.getValue().strip()).toString());
                    continue;
                }
                Header enTete = reponse.getFirstHeader("Content-Type");
                String type = enTete == null ? "" : enTete.getValue();
                HttpEntity corps = reponse.getEntity();
                if (statut != 200 || !typeAccepte.test(type) || corps == null) {
                    requete.cancel();
                    return null;
                }
                byte[] contenu = lireBorne(corps.getContent(), poidsMax, tronquer, echeance, requete);
                return contenu == null ? null : new Ressource(courante, type, contenu);
            } catch (IllegalArgumentException e) {
                throw new LienRefuseException("Ce lien n'est pas une adresse web valide.");
            }
        }
        return null;
    }

    /**
     * Lit au plus {@code poidsMax} octets avant l'échéance. Chaque lecture attend au plus {@link #DELAI} : la durée
     * totale reste donc bornée même si le site envoie un octet de temps en temps.
     */
    static byte[] lireBorne(InputStream flux, long poidsMax, boolean tronquer, long echeance, HttpGet requete) throws IOException {
        ByteArrayOutputStream lu = new ByteArrayOutputStream();
        byte[] tampon = new byte[8192];
        while (true) {
            if (System.nanoTime() > echeance) {
                requete.cancel();
                throw new IOException("Le site met trop de temps à répondre.");
            }
            int n = flux.read(tampon);
            if (n < 0) return lu.toByteArray();
            long place = poidsMax - lu.size();
            if (n > place) {
                requete.cancel();
                if (!tronquer) return null;
                lu.write(tampon, 0, (int) place);
                return lu.toByteArray();
            }
            lu.write(tampon, 0, n);
        }
    }

    private static void exigerAvant(long echeance) throws IOException {
        if (System.nanoTime() > echeance) throw new IOException("Le site met trop de temps à répondre.");
    }

    @Override
    public void destroy() throws IOException {
        client.close();
    }

    /** Résolution DNS qui refuse le nom entier dès qu'une de ses adresses est interne. */
    static final class ResolveurPublic extends SystemDefaultDnsResolver {
        @Override
        public InetAddress[] resolve(String hote) throws UnknownHostException {
            InetAddress[] adresses = super.resolve(hote);
            for (InetAddress adresse : adresses) {
                if (GardeAdresse.interdite(adresse)) throw new UnknownHostException("Adresse interne refusée : " + hote);
            }
            return adresses;
        }

        @Override
        public List<InetSocketAddress> resolve(String hote, int port) throws UnknownHostException {
            return Arrays.stream(resolve(hote)).map(adresse -> new InetSocketAddress(adresse, port)).toList();
        }
    }
}
