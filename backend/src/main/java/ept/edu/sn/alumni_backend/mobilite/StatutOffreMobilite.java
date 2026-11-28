package ept.edu.sn.alumni_backend.mobilite;

/**
 * Cycle de vie d'une offre de mobilité. Publiée dès sa création (pas de vérification préalable) ; « candidatures
 * closes » se déduit de la date limite, sans tâche planifiée.
 */
public enum StatutOffreMobilite {
    PUBLIEE,
    /** Close avant la date limite par l'institut ou le chef du service mobilité. */
    CLOTUREE,
    /** Liste définitive publiée par le chef du service mobilité. */
    LISTE_PUBLIEE,
    /** Retirée par le chef du service mobilité, avec un motif. */
    RETIREE
}
