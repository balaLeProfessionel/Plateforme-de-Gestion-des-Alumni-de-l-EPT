package ept.edu.sn.alumni_backend.apercu;

import java.net.IDN;
import java.net.Inet4Address;
import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.Locale;

/**
 * Le serveur ne va lire que des pages publiques : http(s), ports standards, et un hôte qui ne résout vers aucune
 * adresse interne (boucle locale, réseau privé, lien local, métadonnées du cloud…). Vérifié à chaque redirection.
 */
public final class GardeAdresse {
    private static final String NON_PUBLIC = "Seuls les liens web publics peuvent être importés.";
    private static final String INVALIDE = "Ce lien n'est pas une adresse web valide.";

    private GardeAdresse() {}

    /** Contrôle de forme seul, sans résolution DNS : sert aussi à l'enregistrement du lien d'une publication. */
    public static URI normaliser(String saisie) {
        if (saisie == null || saisie.isBlank()) throw new LienRefuseException("Indiquez l'adresse du lien.");
        String texte = saisie.strip();
        if (texte.length() > 500) throw new LienRefuseException("Le lien ne doit pas dépasser 500 caractères.");
        if (!texte.matches("(?is)^[a-z][a-z0-9+.-]*:.*")) texte = "https://" + texte;
        URI uri;
        try {
            uri = new URI(texte).normalize();
        } catch (URISyntaxException e) {
            throw new LienRefuseException(INVALIDE);
        }
        String schema = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!(schema.equals("http") || schema.equals("https")) || uri.getHost() == null || uri.getHost().isBlank()
                || uri.getRawUserInfo() != null) {
            throw new LienRefuseException(INVALIDE);
        }
        if (uri.getPort() != -1 && uri.getPort() != 80 && uri.getPort() != 443) throw new LienRefuseException(NON_PUBLIC);
        String hote = IDN.toASCII(uri.getHost()).toLowerCase(Locale.ROOT);
        if (hote.equals("localhost") || hote.endsWith(".localhost") || hote.endsWith(".local") || hote.endsWith(".internal")
                || !hote.contains(".") && !hote.contains(":")) {
            throw new LienRefuseException(NON_PUBLIC);
        }
        String chemin = uri.getPath() == null || uri.getPath().isEmpty() ? "/" : uri.getPath();
        try {
            return URI.create(new URI(schema, null, hote, uri.getPort(), chemin, uri.getQuery(), null).toASCIIString());
        } catch (URISyntaxException e) {
            throw new LienRefuseException(INVALIDE);
        }
    }

    /** Résout l'hôte et refuse dès qu'une des adresses est interne. */
    public static void verifierPublique(URI uri) {
        normaliser(uri.toString());
        InetAddress[] adresses;
        try {
            adresses = InetAddress.getAllByName(uri.getHost());
        } catch (UnknownHostException e) {
            throw new LienRefuseException("Ce site est introuvable. Vérifiez le lien.");
        }
        for (InetAddress adresse : adresses) {
            if (interdite(adresse)) throw new LienRefuseException(NON_PUBLIC);
        }
    }

    static boolean interdite(InetAddress adresse) {
        if (adresse.isLoopbackAddress() || adresse.isAnyLocalAddress() || adresse.isLinkLocalAddress()
                || adresse.isSiteLocalAddress() || adresse.isMulticastAddress()) {
            return true;
        }
        byte[] o = adresse.getAddress();
        if (adresse instanceof Inet4Address) {
            int a = o[0] & 0xff;
            int b = o[1] & 0xff;
            return a == 0                                      // 0.0.0.0/8
                || a == 100 && (b & 0xc0) == 64               // 100.64.0.0/10, partage d'adresses opérateur
                || a == 192 && b == 0 && (o[2] & 0xff) == 0   // 192.0.0.0/24
                || a == 198 && (b & 0xfe) == 18               // 198.18.0.0/15, bancs de test
                || a >= 240;                                  // réservé et diffusion
        }
        if (adresse instanceof Inet6Address) {
            boolean ipv4Integree = true;
            for (int i = 0; i < 10; i++) ipv4Integree &= o[i] == 0;
            if (ipv4Integree && (o[10] & 0xff) == 0xff && (o[11] & 0xff) == 0xff) {
                try {
                    return interdite(InetAddress.getByAddress(new byte[] {o[12], o[13], o[14], o[15]}));
                } catch (UnknownHostException e) {
                    return true;
                }
            }
            return (o[0] & 0xfe) == 0xfc;                     // fc00::/7, adresses locales uniques
        }
        return true;
    }
}
