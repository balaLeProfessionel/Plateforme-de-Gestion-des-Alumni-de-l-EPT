package ept.edu.sn.alumni_backend.apercu;

import java.net.URI;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Lit les balises d'aperçu d'une page HTML, sans bibliothèque : seules quelques balises de l'en-tête comptent. */
public final class LecteurMeta {
    private static final Pattern META = Pattern.compile("<meta\\b[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTRIBUT = Pattern.compile(
        "([a-zA-Z_:][-a-zA-Z0-9_:.]*)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s\"'>]+))");
    private static final Pattern TITRE = Pattern.compile("<title\\b[^>]*>(.*?)</title>", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern ENTITE = Pattern.compile("&(#[xX][0-9a-fA-F]{1,6}|#[0-9]{1,7}|[a-zA-Z]{2,8});");
    private static final Map<String, String> ENTITES = Map.of("amp", "&", "lt", "<", "gt", ">", "quot", "\"",
        "apos", "'", "nbsp", " ", "hellip", "…", "rsquo", "’", "laquo", "«", "raquo", "»");

    static final int TITRE_MAX = 300;
    static final int DESCRIPTION_MAX = 5000;

    private LecteurMeta() {}

    public static ApercuLienResponse lire(String html, URI page) {
        Map<String, String> metas = new HashMap<>();
        Matcher balise = META.matcher(html);
        while (balise.find()) {
            Map<String, String> attributs = attributs(balise.group());
            String cle = attributs.getOrDefault("property", attributs.get("name"));
            String contenu = attributs.get("content");
            if (cle != null && contenu != null && !contenu.isBlank()) {
                metas.putIfAbsent(cle.toLowerCase(Locale.ROOT), decoder(contenu));
            }
        }
        Matcher titreHtml = TITRE.matcher(html);
        String titre = premier(metas.get("og:title"), metas.get("twitter:title"),
            titreHtml.find() ? decoder(titreHtml.group(1)) : null);
        String description = premier(metas.get("og:description"), metas.get("twitter:description"), metas.get("description"));
        String image = adresseImage(page, premier(metas.get("og:image:secure_url"), metas.get("og:image"),
            metas.get("twitter:image"), metas.get("twitter:image:src")));
        String site = premier(metas.get("og:site_name"), hote(page));
        return new ApercuLienResponse(page.toString(), couper(uneLigne(titre), TITRE_MAX),
            couper(paragraphes(description), DESCRIPTION_MAX), image, couper(uneLigne(site), 120));
    }

    public static String hote(URI page) {
        String hote = page.getHost();
        return hote == null ? null : hote.startsWith("www.") ? hote.substring(4) : hote;
    }

    private static Map<String, String> attributs(String balise) {
        Map<String, String> attributs = new HashMap<>();
        Matcher m = ATTRIBUT.matcher(balise);
        while (m.find()) {
            String valeur = m.group(2) != null ? m.group(2) : m.group(3) != null ? m.group(3) : m.group(4);
            attributs.putIfAbsent(m.group(1).toLowerCase(Locale.ROOT), valeur);
        }
        return attributs;
    }

    static String decoder(String texte) {
        Matcher m = ENTITE.matcher(texte);
        StringBuilder sortie = new StringBuilder();
        while (m.find()) {
            String code = m.group(1);
            String remplacement;
            try {
                if (code.startsWith("#x") || code.startsWith("#X")) {
                    remplacement = Character.toString(Integer.parseInt(code.substring(2), 16));
                } else if (code.startsWith("#")) {
                    remplacement = Character.toString(Integer.parseInt(code.substring(1)));
                } else {
                    remplacement = ENTITES.getOrDefault(code.toLowerCase(Locale.ROOT), m.group());
                }
            } catch (IllegalArgumentException e) {
                remplacement = m.group();
            }
            m.appendReplacement(sortie, Matcher.quoteReplacement(remplacement));
        }
        m.appendTail(sortie);
        return sortie.toString();
    }

    private static String adresseImage(URI page, String brute) {
        if (brute == null || brute.length() > 1000) return null;
        try {
            URI image = page.resolve(brute.strip().replace(" ", "%20"));
            String schema = image.getScheme() == null ? "" : image.getScheme().toLowerCase(Locale.ROOT);
            return schema.equals("http") || schema.equals("https") ? image.toString() : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static String premier(String... valeurs) {
        for (String valeur : valeurs) if (valeur != null && !valeur.isBlank()) return valeur;
        return null;
    }

    private static String uneLigne(String texte) {
        return texte == null ? null : vide(texte.replaceAll("\\s+", " ").strip());
    }

    private static String paragraphes(String texte) {
        if (texte == null) return null;
        String propre = texte.replace("\r\n", "\n").replaceAll("[ \\t\\x0B\\f]+", " ").replaceAll(" *\n *", "\n")
            .replaceAll("\n{3,}", "\n\n").strip();
        return vide(propre);
    }

    private static String vide(String texte) {
        return texte.isEmpty() ? null : texte;
    }

    public static String couper(String texte, int max) {
        if (texte == null || texte.length() <= max) return texte;
        return texte.substring(0, max - 1).stripTrailing() + "…";
    }
}
