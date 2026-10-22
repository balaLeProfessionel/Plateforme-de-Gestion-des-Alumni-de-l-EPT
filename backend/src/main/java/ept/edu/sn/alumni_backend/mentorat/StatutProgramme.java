package ept.edu.sn.alumni_backend.mentorat;

import java.util.Set;

/**
 * Cycle d'un programme : en préparation, ouvert aux rattachements, en cours (plus de nouveaux
 * mentorats, le suivi continue), puis clos (consultation seule).
 */
public enum StatutProgramme {
    BROUILLON,
    OUVERT,
    EN_COURS,
    CLOS;

    /** Transitions permises ; le retour en brouillon est en plus soumis à l'absence de mentorat. */
    public boolean peutPasserA(StatutProgramme cible) {
        return switch (this) {
            case BROUILLON -> cible == OUVERT;
            case OUVERT -> Set.of(BROUILLON, EN_COURS, CLOS).contains(cible);
            case EN_COURS -> Set.of(OUVERT, CLOS).contains(cible);
            case CLOS -> false;
        };
    }

    /** Un programme clos est figé : on ne modifie plus ni sa présentation ni ses étapes. */
    public boolean estModifiable() {
        return this != CLOS;
    }
}
