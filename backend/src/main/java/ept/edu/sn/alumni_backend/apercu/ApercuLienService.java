package ept.edu.sn.alumni_backend.apercu;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Aperçu d'un lien collé par un membre, comme dans une messagerie. Les aperçus sont gardés une demi-heure :
 * la publication reprend celui que le membre a vu, et seules leurs images peuvent être relayées.
 */
@Service
public class ApercuLienService {
    private static final long PAGE_MAX = 1024 * 1024;
    private static final long IMAGE_MAX = 5 * 1024 * 1024;
    private static final Duration DUREE_CACHE = Duration.ofMinutes(30);
    private static final int TAILLE_CACHE = 300;
    private static final Pattern JEU_CARACTERES = Pattern.compile("charset=\"?([\\w.:-]+)", Pattern.CASE_INSENSITIVE);

    private final Telechargeur telechargeur;
    private final Clock horloge;
    private final Map<String, Entree> cache = new LinkedHashMap<>(64, 0.75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, Entree> plusAncienne) {
            return size() > TAILLE_CACHE;
        }
    };

    @Autowired
    public ApercuLienService(Telechargeur telechargeur) {
        this(telechargeur, Clock.systemUTC());
    }

    ApercuLienService(Telechargeur telechargeur, Clock horloge) {
        this.telechargeur = telechargeur;
        this.horloge = horloge;
    }

    /** Lit la page ; si elle refuse ou ne dit rien d'elle-même, l'aperçu ne porte que l'adresse et le site. */
    public ApercuLienResponse apercu(String saisie) {
        URI adresse = GardeAdresse.normaliser(saisie);
        Optional<ApercuLienResponse> connu = enCache(adresse.toString());
        if (connu.isPresent()) return connu.get();
        ApercuLienResponse apercu = minimal(adresse);
        try {
            Telechargeur.Ressource page = telechargeur.lire(adresse, PAGE_MAX, ApercuLienService::estHtml, true);
            if (page != null) {
                ApercuLienResponse lu = LecteurMeta.lire(new String(page.contenu(), jeuDeCaracteres(page.type())), adresse);
                apercu = new ApercuLienResponse(adresse.toString(), lu.titre(), lu.description(), lu.image(), lu.site());
            }
        } catch (IOException e) {
            // Page muette ou trop lente : l'aperçu minimal suffit. Une adresse interne, elle, est refusée (400).
        }
        synchronized (cache) {
            cache.put(adresse.toString(), new Entree(apercu, horloge.instant().plus(DUREE_CACHE)));
        }
        return apercu;
    }

    /** L'aperçu déjà vu pour cette adresse, sans aller sur le réseau. */
    public Optional<ApercuLienResponse> enCache(String adresse) {
        Instant maintenant = horloge.instant();
        synchronized (cache) {
            Entree entree = cache.get(adresse);
            if (entree == null) return Optional.empty();
            if (entree.expire().isBefore(maintenant)) {
                cache.remove(adresse);
                return Optional.empty();
            }
            return Optional.of(entree.apercu());
        }
    }

    /** Relaye l'image d'un aperçu récent (JPEG ou PNG, 5 Mo au plus) pour que le membre puisse la recadrer. */
    public Optional<Telechargeur.Ressource> image(String adresse) {
        if (!imageConnue(adresse)) return Optional.empty();
        try {
            return Optional.ofNullable(telechargeur.lire(URI.create(adresse), IMAGE_MAX, ApercuLienService::estImage, false));
        } catch (IOException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private boolean imageConnue(String adresse) {
        Instant maintenant = horloge.instant();
        synchronized (cache) {
            return cache.values().stream()
                .anyMatch(e -> !e.expire().isBefore(maintenant) && adresse.equals(e.apercu().image()));
        }
    }

    public static ApercuLienResponse minimal(URI adresse) {
        return new ApercuLienResponse(adresse.toString(), null, null, null, LecteurMeta.hote(adresse));
    }

    private static boolean estHtml(String type) {
        String t = type.toLowerCase(Locale.ROOT);
        return t.startsWith("text/html") || t.startsWith("application/xhtml+xml");
    }

    private static boolean estImage(String type) {
        String t = type.toLowerCase(Locale.ROOT);
        return t.startsWith("image/jpeg") || t.startsWith("image/png");
    }

    private static Charset jeuDeCaracteres(String type) {
        Matcher m = JEU_CARACTERES.matcher(type);
        if (m.find()) {
            try {
                return Charset.forName(m.group(1));
            } catch (IllegalArgumentException e) {
                return StandardCharsets.UTF_8;
            }
        }
        return StandardCharsets.UTF_8;
    }

    private record Entree(ApercuLienResponse apercu, Instant expire) {}
}
