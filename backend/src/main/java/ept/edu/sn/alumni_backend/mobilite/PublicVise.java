package ept.edu.sn.alumni_backend.mobilite;

import ept.edu.sn.alumni_backend.enums.TypeRole;

/** Qui peut candidater à une offre : les étudiants, les enseignants (rôle PERSONNEL) ou les deux. */
public enum PublicVise {
    ETUDIANTS,
    ENSEIGNANTS,
    TOUS;

    public boolean admet(TypeRole role) {
        return switch (this) {
            case ETUDIANTS -> role == TypeRole.ETUDIANT;
            case ENSEIGNANTS -> role == TypeRole.PERSONNEL;
            case TOUS -> role == TypeRole.ETUDIANT || role == TypeRole.PERSONNEL;
        };
    }
}
