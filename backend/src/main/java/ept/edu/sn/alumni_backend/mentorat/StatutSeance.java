package ept.edu.sn.alumni_backend.mentorat;

public enum StatutSeance {
    PLANIFIEE,
    REALISEE,
    ANNULEE;

    public boolean peutPasserA(StatutSeance cible) {
        return this == PLANIFIEE ? cible != PLANIFIEE : this == cible;
    }
}
