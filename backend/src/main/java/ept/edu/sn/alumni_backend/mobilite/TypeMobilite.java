package ept.edu.sn.alumni_backend.mobilite;

/** Nature d'une mobilité : échange ou double diplôme pour les étudiants, séjour d'enseignement ou de recherche pour les enseignants. */
public enum TypeMobilite {
    ECHANGE("Échange"),
    DOUBLE_DIPLOME("Double diplôme"),
    ENSEIGNEMENT_RECHERCHE("Enseignement ou recherche");

    private final String libelle;

    TypeMobilite(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
