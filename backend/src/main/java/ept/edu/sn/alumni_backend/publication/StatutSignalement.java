package ept.edu.sn.alumni_backend.publication;

/**
 * Cycle d'un signalement : EN_ATTENTE → PUBLICATION_MASQUEE (l'administration retire la publication du fil)
 * ou EN_ATTENTE → REJETE (la publication reste visible). Masquer une publication clôt tous ses signalements en attente.
 */
public enum StatutSignalement {
    EN_ATTENTE, PUBLICATION_MASQUEE, REJETE
}
