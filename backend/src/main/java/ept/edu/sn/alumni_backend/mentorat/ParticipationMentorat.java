package ept.edu.sn.alumni_backend.mentorat;

import java.util.Set;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/**
 * Qui prend part au mentorat : les étudiants et les alumni, mentors comme mentorés. Le personnel, les visiteurs,
 * les organismes et l'administration n'y participent pas.
 */
public final class ParticipationMentorat {
    public static final Set<TypeRole> ROLES = Set.of(
        TypeRole.ETUDIANT, TypeRole.ALUMNI);

    /** Demandes sans réponse qu'une même personne peut avoir en même temps, tous mentors confondus. */
    public static final int DEMANDES_EN_ATTENTE_MAX = 3;

    private ParticipationMentorat() {
    }

    public static boolean autorise(TypeRole role) {
        return ROLES.contains(role);
    }
}
