package ept.edu.sn.alumni_backend.mentorat;

import java.util.Set;

/** Cycle de vie d'un mentorat : de la demande à la clôture. */
public enum StatutMentorat {
    EN_ATTENTE,
    ACCEPTEE,
    REFUSEE,
    ANNULEE,
    TERMINEE;

    /** Statuts qui occupent la relation entre un mentoré et un mentor. */
    public static final Set<StatutMentorat> EN_COURS = Set.of(EN_ATTENTE, ACCEPTEE);

    public boolean peutPasserA(StatutMentorat cible) {
        return switch (this) {
            case EN_ATTENTE -> cible == ACCEPTEE || cible == REFUSEE || cible == ANNULEE;
            case ACCEPTEE -> cible == TERMINEE;
            case REFUSEE, ANNULEE, TERMINEE -> false;
        };
    }
}
