package ept.edu.sn.alumni_backend.mentorat;

import java.util.Set;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/**
 * Qui prend part au mentorat : toute personne membre (étudiant, alumni, personnel, visiteur) peut être
 * mentor et mentoré. Les comptes d'organisme et d'administration n'y participent pas.
 */
public final class ParticipationMentorat {
    public static final Set<TypeRole> ROLES = Set.of(
        TypeRole.ETUDIANT, TypeRole.ALUMNI, TypeRole.PERSONNEL, TypeRole.VISITEUR);

    /** Demandes sans réponse qu'une même personne peut avoir en même temps, tous mentors confondus. */
    public static final int DEMANDES_EN_ATTENTE_MAX = 3;

    private ParticipationMentorat() {
    }

    public static boolean autorise(TypeRole role) {
        return ROLES.contains(role);
    }
}
