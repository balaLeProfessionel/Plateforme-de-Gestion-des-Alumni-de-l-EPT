package ept.edu.sn.alumni_backend.partenariat;

/**
 * Cycle d'un accord de stage ou de mobilité. Proposé par l'organisme ou par l'école, l'autre partie l'accepte ou le
 * refuse ; accepté, il est A_VENIR jusqu'à sa date de début puis ACTIF jusqu'à sa date de fin (TERMINE). Chaque
 * partie peut le résilier avec un préavis de trois mois : il reste en vigueur jusqu'à la fin du préavis (RESILIE). Une proposition refusée ne se renvoie pas : on en crée une nouvelle.
 */
public enum StatutAccord {
    PROPOSE,
    REFUSE,
    RETIRE,
    A_VENIR,
    ACTIF,
    TERMINE,
    RESILIE;

    /** Accord en vigueur ou sur le point de l'être. */
    public boolean estEnVigueur() {
        return this == A_VENIR || this == ACTIF;
    }
}
