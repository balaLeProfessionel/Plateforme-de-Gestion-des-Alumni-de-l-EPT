package ept.edu.sn.alumni_backend.partenariat;

import java.util.EnumSet;
import java.util.Set;

/**
 * Cycle d'une convention-cadre de partenariat. Une demande de l'organisme naît DEMANDEE ; une convention saisie par
 * l'école naît EN_NEGOCIATION ou ACTIVE. L'organisme est partenaire de l'EPT tant qu'une de ses conventions est ACTIVE ;
 * le passage à EXPIREE se fait seul, à la date de fin. Chaque partie peut la résilier avec un préavis de trois mois :
 * elle reste ACTIVE jusqu'à la fin du préavis, puis passe à RESILIEE. Aucune convention n'est supprimée.
 */
public enum StatutConvention {
    DEMANDEE,
    EN_EXAMEN,
    EN_NEGOCIATION,
    ACTIVE,
    REFUSEE,
    ANNULEE,
    RESILIEE,
    EXPIREE;

    /** Demande pas encore conclue : l'organisme n'en a qu'une à la fois. */
    public static final Set<StatutConvention> EN_COURS = EnumSet.of(DEMANDEE, EN_EXAMEN, EN_NEGOCIATION);

    public boolean estEnCours() {
        return EN_COURS.contains(this);
    }

    /** Transitions décidées par le service des Relations extérieures (EXPIREE, ANNULEE et RESILIEE ne le sont pas). */
    public boolean peutPasserA(StatutConvention suivant) {
        return switch (this) {
            case DEMANDEE -> suivant == EN_EXAMEN || suivant == REFUSEE;
            case EN_EXAMEN -> suivant == EN_NEGOCIATION || suivant == ACTIVE || suivant == REFUSEE;
            case EN_NEGOCIATION -> suivant == ACTIVE || suivant == REFUSEE;
            default -> false;
        };
    }
}
