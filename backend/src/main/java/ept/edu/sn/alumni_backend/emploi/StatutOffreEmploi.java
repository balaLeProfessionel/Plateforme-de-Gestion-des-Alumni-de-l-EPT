package ept.edu.sn.alumni_backend.emploi;

/**
 * Cycle de vie d'une offre d'emploi. Une offre publiée dont la date d'expiration est passée reste PUBLIEE :
 * « expirée » se déduit de la date, sans tâche planifiée.
 */
public enum StatutOffreEmploi {
    /** Offre gérée d'un organisme non validé, en attente de l'administration (#224). */
    SOUMISE,
    PUBLIEE,
    /** Refusée par l'administration, avec un motif (#224). */
    REFUSEE,
    /** Retirée par son auteur, ou par l'administration avec un motif (#224). */
    RETIREE
}
