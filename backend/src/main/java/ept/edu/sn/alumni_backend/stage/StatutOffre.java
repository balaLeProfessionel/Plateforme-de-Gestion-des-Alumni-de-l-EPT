package ept.edu.sn.alumni_backend.stage;

/**
 * Cycle de vie d'une offre de stage (STA-01). Une offre publiée dont la date limite est passée reste PUBLIEE :
 * « candidatures closes » se déduit de la date, sans tâche planifiée.
 */
public enum StatutOffre {
    /** Déposée par un organisme non validé : en attente de l'administrateur Stages. */
    SOUMISE,
    PUBLIEE,
    /** Liste définitive publiée par l'administrateur Stages (STA-04) : candidatures closes, avis figés. */
    LISTE_PUBLIEE,
    /** Refusée par l'administrateur Stages, avec un motif. */
    REFUSEE,
    /** Retirée par l'organisme, ou par l'administrateur Stages avec un motif. */
    RETIREE
}
