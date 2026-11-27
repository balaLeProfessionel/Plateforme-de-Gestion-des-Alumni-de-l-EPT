package ept.edu.sn.alumni_backend.emploi;

/**
 * Cycle d'une candidature à une offre gérée. Le candidat envoie (RECUE) et peut retirer tant qu'elle n'est pas traitée ;
 * l'organisme la fait avancer (#223) : PRESELECTIONNEE, ENTRETIEN, puis RETENUE ou NON_RETENUE.
 */
public enum StatutCandidatureEmploi {
    RECUE,
    PRESELECTIONNEE,
    ENTRETIEN,
    RETENUE,
    NON_RETENUE,
    RETIREE
}
