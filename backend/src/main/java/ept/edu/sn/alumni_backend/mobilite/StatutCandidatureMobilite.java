package ept.edu.sn.alumni_backend.mobilite;

/**
 * Cycle d'une candidature à une offre de mobilité. Retirée puis renvoyée, c'est la même ligne qui repasse à SOUMISE.
 * Les décisions (retenue, liste d'attente, non retenue) et le désistement sont posés par la tranche suivante.
 */
public enum StatutCandidatureMobilite {
    SOUMISE,
    RETIREE,
    RETENUE,
    LISTE_ATTENTE,
    NON_RETENUE,
    DESISTEE,
    /** Retenue, mais sa mobilité a été annulée par le chef du service mobilité : la place est libérée. */
    ANNULEE
}
