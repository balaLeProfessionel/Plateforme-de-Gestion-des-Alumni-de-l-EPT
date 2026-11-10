package ept.edu.sn.alumni_backend.stage;

/** Types de stage du cursus de l'EPT (compte rendu du cadrage des stages). */
public enum TypeStage {
    INCLUSION("Inclusion"),
    MAITRISE("Maîtrise"),
    PFE("Projet de fin d'études"),
    ALTERNANCE("Alternance");

    private final String libelle;

    TypeStage(String libelle) {
        this.libelle = libelle;
    }

    public String libelle() {
        return libelle;
    }
}
