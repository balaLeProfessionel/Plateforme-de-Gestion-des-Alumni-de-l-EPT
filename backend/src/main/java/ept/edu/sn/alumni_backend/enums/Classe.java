package ept.edu.sn.alumni_backend.enums;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;

/**
 * Classe d'un étudiant de l'EPT pour l'année en cours : cycle ingénieur (tronc commun puis DIC), master ou doctorat.
 * Elle change chaque année ; seule l'administration la modifie après l'inscription.
 */
public enum Classe {
    TC1("TC1"),
    TC2("TC2"),
    DIC1("DIC1"),
    DIC2("DIC2"),
    DIC3("DIC3"),
    MASTER1("Master 1"),
    MASTER2("Master 2"),
    DOCTORAT1("Doctorat 1"),
    DOCTORAT2("Doctorat 2"),
    DOCTORAT3("Doctorat 3");

    private final String libelle;

    Classe(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }

    /** « DIC 1 », « dic1 », « Master 2 », « MASTER2 » : espaces et casse ignorés (import d'une promotion). */
    public static Optional<Classe> depuisTexte(String texte) {
        if (texte == null || texte.isBlank()) return Optional.empty();
        String cle = texte.replaceAll("[\\s_-]", "").toUpperCase(Locale.ROOT);
        return Arrays.stream(values()).filter(c -> c.name().equals(cle)).findFirst();
    }

    /** Valeur attendue pour un champ facultatif : vide, ou une classe connue (sinon 400). */
    public static Classe lire(String texte) {
        if (texte == null || texte.isBlank()) return null;
        return depuisTexte(texte).orElseThrow(() -> new IllegalArgumentException(
            "Classe inconnue : « " + texte.strip() + " ». Classes possibles : TC1, TC2, DIC1, DIC2, DIC3, Master 1, Master 2, Doctorat 1 à 3."));
    }
}
